# ============================================================
#  Neural Brief — Weekly AI Digest Pipeline
#  Stack: Groq (free) + Brevo + Supabase
#  Features: Biggest Move, Why it matters, Source labels, Jargon of week
#
#  Run: python digest.py
#  Cron (PythonAnywhere, every Friday 9am IST): 30 3 * * 5
# ============================================================

import os, re, json, smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from dotenv import load_dotenv

import feedparser
from groq import Groq
from supabase import create_client

load_dotenv()

# ── Clients ──────────────────────────────────────────────────
groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
supabase    = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

BREVO_SMTP_HOST  = "smtp-relay.brevo.com"
BREVO_SMTP_PORT  = 587
BREVO_SMTP_LOGIN = os.environ["BREVO_SMTP_LOGIN"]
BREVO_SMTP_KEY   = os.environ["BREVO_SMTP_KEY"]

FROM_EMAIL    = f"Neural Brief <{os.environ.get('BREVO_FROM_EMAIL', 'neuralbrief18@gmail.com')}>"
REPLY_TO      = os.environ.get('BREVO_FROM_EMAIL', 'neuralbrief18@gmail.com')
WEBSITE       = "https://neuralbriefai.vercel.app"
STORIES_COUNT = 15

# ── Source credibility labels ─────────────────────────────────
SOURCE_LABELS = {
    "Google DeepMind":       {"label": "Official",  "bg": "#edf5eb", "color": "#357025", "border": "#bdd9b7"},
    "OpenAI Blog":           {"label": "Official",  "bg": "#edf5eb", "color": "#357025", "border": "#bdd9b7"},
    "TechCrunch AI":         {"label": "Media",     "bg": "#ebf0f9", "color": "#27438a", "border": "#bcc9ec"},
    "MIT Technology Review": {"label": "Research",  "bg": "#f3f0fb", "color": "#4f2fa8", "border": "#cfc6f0"},
    "VentureBeat AI":        {"label": "Media",     "bg": "#ebf0f9", "color": "#27438a", "border": "#bcc9ec"},
    "The Verge AI":          {"label": "Media",     "bg": "#ebf0f9", "color": "#27438a", "border": "#bcc9ec"},
    "HackerNews AI":         {"label": "Community", "bg": "#fdf5e8", "color": "#7a5018", "border": "#e8d3a0"},
    "Wired AI":              {"label": "Media",     "bg": "#ebf0f9", "color": "#27438a", "border": "#bcc9ec"},
    "arXiv CS.AI":           {"label": "Research",  "bg": "#f3f0fb", "color": "#4f2fa8", "border": "#cfc6f0"},
}

TAG_COLORS = {
    "New Model":  {"bg": "#fef0ec", "color": "#c13d18", "border": "#f5cec4"},
    "Research":   {"bg": "#edf5eb", "color": "#357025", "border": "#bdd9b7"},
    "Industry":   {"bg": "#ebf0f9", "color": "#27438a", "border": "#bcc9ec"},
    "Tool Drop":  {"bg": "#fdf5e8", "color": "#7a5018", "border": "#e8d3a0"},
    "Policy":     {"bg": "#f3f0fb", "color": "#4f2fa8", "border": "#cfc6f0"},
    "Opinion":    {"bg": "#f3f0fb", "color": "#4f2fa8", "border": "#cfc6f0"},
}

RSS_FEEDS = [
    {"name": "TechCrunch AI",         "url": "https://techcrunch.com/category/artificial-intelligence/feed/"},
    {"name": "The Verge AI",          "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"},
    {"name": "HackerNews AI",         "url": "https://hnrss.org/frontpage?q=AI+OR+LLM+OR+machine+learning"},
    {"name": "MIT Technology Review", "url": "https://www.technologyreview.com/feed/"},
    {"name": "VentureBeat AI",        "url": "https://venturebeat.com/category/ai/feed/"},
    {"name": "Google DeepMind",       "url": "https://deepmind.google/blog/rss.xml"},
    {"name": "Anthropic Blog",        "url": "https://www.anthropic.com/rss.xml"},
    {"name": "Google AI Blog",        "url": "https://blog.google/technology/ai/rss/"},
    {"name": "Hugging Face",          "url": "https://huggingface.co/blog/feed.xml"},
    {"name": "The Batch",             "url": "https://www.deeplearning.ai/the-batch/feed/"},
    {"name": "Wired AI",              "url": "https://www.wired.com/feed/tag/artificial-intelligence/latest/rss"},
]


# ── Step 1: Fetch stories ────────────────────────────────────
def fetch_stories(max_per_feed=10):
    all_stories = []
    for feed_info in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_info["url"])
            for entry in feed.entries[:max_per_feed]:
                desc = (
                    entry.get("summary", "") or
                    entry.get("description", "") or
                    (entry.get("content") or [{}])[0].get("value", "")
                )
                desc = re.sub(r"<[^>]+>", "", desc).strip()
                all_stories.append({
                    "source":      feed_info["name"],
                    "title":       entry.get("title", "Untitled"),
                    "description": desc[:800],
                    "link":        entry.get("link", ""),
                })
        except Exception as e:
            print(f"  ⚠️  {feed_info['name']}: {e}")
    print(f"  📡 Fetched {len(all_stories)} raw stories")
    return all_stories


# ── Step 2: Deduplicate ──────────────────────────────────────
def filter_seen(stories):
    try:
        seen = supabase.table("sent_stories").select("title_hash").execute()
        seen_hashes = {r["title_hash"] for r in seen.data}
        fresh = [s for s in stories if str(hash(s["title"][:60])) not in seen_hashes]
        print(f"  🔍 {len(fresh)} fresh stories")
        return fresh
    except Exception:
        return stories


def mark_sent(stories):
    try:
        rows = [{"title_hash": str(hash(s["title"][:60])), "sent_at": datetime.now().isoformat()} for s in stories]
        supabase.table("sent_stories").insert(rows).execute()
    except Exception as e:
        print(f"  ⚠️  Could not mark sent: {e}")


# ── Step 3: Groq — pick + summarise with all new fields ──────
def select_and_summarise(stories):
    stories_text = ""
    for i, s in enumerate(stories):
        stories_text += f"\n[{i+1}] SOURCE: {s['source']}\nTITLE: {s['title']}\nDESC: {s['description'][:300]}\nLINK: {s['link']}\n"

    prompt = f"""You are the editor of Neural Brief, a weekly AI news digest for Indian college students.

Here are {len(stories)} AI stories from this week:
{stories_text}

Pick the {STORIES_COUNT} most important, interesting, and varied stories. Cover different categories.

Also pick ONE "biggest_move" — the single most important AI story of the week (major launch, acquisition, or breakthrough).

Also pick ONE "jargon_of_week" — one AI/ML term from this week's stories explained in plain English for students.

For each of the {STORIES_COUNT} stories write:
- tag: one of [New Model, Research, Industry, Tool Drop, Policy, Opinion]
- title: clean headline, max 12 words
- summary: 2-3 sentences, plain English, zero jargon, for students
- tldr: one punchy sentence starting with "-> TL;DR:"
- why_student: one sentence — why should an Indian STUDENT care?
- why_developer: one sentence — why should an Indian DEVELOPER care?
- why_founder: one sentence — why should an Indian FOUNDER/entrepreneur care?
- signal_score: number 1-10 rating importance. 9-10=major breakthrough, 7-8=significant, 5-6=interesting, below 5=minor
- signal_label: one of ["Major", "Important", "Interesting", "Minor"]
- tweet: ready-to-post Twitter post, punchy, end with 2-3 hashtags. Max 280 chars.
- linkedin: polished 3-sentence thought-leader LinkedIn post. Professional tone. End with 2-3 hashtags.
- eli15: explain in 1-2 sentences like reader is 15. Simple analogies, zero jargon.
- hype: one sentence — what media/company claims (exaggerated/marketing spin)
- reality: one sentence — what it actually means in plain honest truth
- source: source name
- link: original link exactly

Return ONLY valid JSON, no markdown backticks:
{{
  "biggest_move": {{"title":"...","reason":"one sentence why this is the biggest move","link":"..."}},
  "jargon_of_week": {{"term":"...","explanation":"..."}},
  "stories": [{{"tag":"...","title":"...","summary":"...","tldr":"...","why_student":"...","why_developer":"...","why_founder":"...","signal_score":8.5,"signal_label":"Important","tweet":"...","linkedin":"...","eli15":"...","hype":"...","reality":"...","source":"...","link":"..."}}]
}}"""

    resp = groq_client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.35,
        max_tokens=8000,
    )

    raw    = resp.choices[0].message.content.strip().replace("```json", "").replace("```", "").strip()
    result = json.loads(raw)
    print(f"  🧠 Groq selected {len(result['stories'])} stories")
    return result


# ── Step 4: Build HTML email ─────────────────────────────────
def build_html(result, brief_num, email):
    stories      = result.get("stories", [])
    biggest_move = result.get("biggest_move")
    jargon       = result.get("jargon_of_week")
    date_str     = datetime.now().strftime("%A, %d %B %Y").upper()

    # Biggest move banner
    biggest_banner = ""
    if biggest_move:
        biggest_banner = f"""
<div style="margin:0 40px;padding:20px 24px;background:#18160f;border-radius:3px;">
  <div style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,.4);letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;">
    ★ Biggest move this week
  </div>
  <a href="{biggest_move.get('link','#')}" style="text-decoration:none;">
    <div style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#fff;margin-bottom:6px;line-height:1.3;">{biggest_move.get('title','')}</div>
  </a>
  <div style="font-size:12px;color:rgba(255,255,255,.45);line-height:1.6;">{biggest_move.get('reason','')}</div>
</div>
<div style="height:1px;background:#d6d0c2;margin:20px 40px 0;"></div>"""

    # Story blocks
    story_blocks = ""
    for i, story in enumerate(stories):
        tag       = story.get("tag", "Research")
        colors    = TAG_COLORS.get(tag, TAG_COLORS["Research"])
        src_info  = SOURCE_LABELS.get(story.get("source", ""), None)
        link      = story.get("link", "#")
        tweet     = story.get("tweet", "")
        why       = story.get("why_it_matters", "")

        src_badge = ""
        if src_info:
            src_badge = f"""<span style="font-size:9px;font-family:'Courier New',monospace;padding:2px 8px;border-radius:1px;
              text-transform:uppercase;letter-spacing:.08em;font-weight:500;
              background:{src_info['bg']};color:{src_info['color']};border:1px solid {src_info['border']};">{src_info['label']}</span>"""

        why_block = ""
        if why:
            why_block = f"""
  <div style="background:#f4f1ea;border-left:3px solid #c13d18;padding:8px 12px;margin:8px 0;">
    <span style="font-family:'Courier New',monospace;font-size:9px;color:#c13d18;text-transform:uppercase;letter-spacing:.08em;">Why it matters → </span>
    <span style="font-size:12px;color:#5a5550;line-height:1.6;">{why}</span>
  </div>"""

        tweet_block = ""
        if tweet:
            tweet_block = f"""
  <div style="background:#fafaf8;border:1px solid #e8e3db;border-radius:3px;padding:12px 14px;margin-top:8px;">
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;">Share this story</div>
    <p style="font-size:12px;color:#18160f;line-height:1.6;margin:0 0 8px;">{tweet}</p>
    <a href="https://twitter.com/intent/tweet?text={tweet.replace(' ','%20')}"
      style="display:inline-block;font-size:10px;font-family:'Courier New',monospace;color:#c13d18;text-decoration:none;border:1px solid #f5cec4;padding:3px 10px;border-radius:2px;margin-right:6px;">
      Post on X →
    </a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url={link}"
      style="display:inline-block;font-size:10px;font-family:'Courier New',monospace;color:#27438a;text-decoration:none;border:1px solid #bcc9ec;padding:3px 10px;border-radius:2px;">
      Post on LinkedIn →
    </a>
  </div>"""

        story_blocks += f"""
<div style="padding:20px 0;border-bottom:1px solid #e8e3db;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
    <span style="font-family:'Courier New',monospace;font-size:11px;color:#bfb9aa;">#{str(i+1).zfill(2)}</span>
    <span style="font-size:9px;font-family:'Courier New',monospace;padding:2px 8px;border-radius:1px;
      text-transform:uppercase;letter-spacing:.08em;font-weight:500;
      background:{colors['bg']};color:{colors['color']};border:1px solid {colors['border']};">{tag}</span>
    {src_badge}
  </div>
  <a href="{link}" style="text-decoration:none;">
    <h2 style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#18160f;margin:0 0 8px;line-height:1.3;">{story.get('title','')}</h2>
  </a>
  <p style="font-size:13px;color:#5a5550;margin:0 0 6px;line-height:1.75;">{story.get('summary','')}</p>
  <p style="font-size:11px;font-family:'Courier New',monospace;color:#c13d18;margin:0 0 6px;">{story.get('tldr','')}</p>
  {why_block}
  <p style="font-size:10px;color:#bfb9aa;margin:0 0 4px;">via {story.get('source','Neural Brief')}</p>
  {tweet_block}
</div>"""

    # Jargon block
    jargon_block = ""
    if jargon:
        jargon_block = f"""
<div style="margin:0 40px 28px;padding:20px 24px;background:#f4f1ea;border:1px solid #d6d0c2;border-radius:3px;">
  <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;">
    📖 Jargon of the week
  </div>
  <span style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#18160f;">{jargon.get('term','')}</span>
  <p style="font-size:13px;color:#5a5550;margin:6px 0 0;line-height:1.7;">{jargon.get('explanation','')}</p>
</div>"""

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Neural Brief #{brief_num}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Helvetica Neue',Helvetica,sans-serif;">
<div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #d6d0c2;">

  <div style="text-align:center;padding:32px 40px 20px;border-bottom:3px double #d6d0c2;">
    <div style="font-family:Georgia,serif;font-size:38px;font-weight:bold;color:#18160f;letter-spacing:-.02em;line-height:1;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    <div style="font-family:'Courier New',monospace;font-size:9px;color:#9a938a;letter-spacing:.1em;text-transform:uppercase;margin-top:6px;">
      THIS WEEK IN AI &middot; BRIEF #{brief_num} &middot; {date_str}
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;padding:10px 40px;background:#f4f1ea;border-bottom:1px solid #d6d0c2;font-family:'Courier New',monospace;font-size:10px;color:#9a938a;">
    <span>{len(stories)} stories</span>
    <span>~{len(stories)} min read</span>
    <span>neuralbriefai.vercel.app</span>
  </div>

  {biggest_banner}

  <div style="padding:8px 40px 28px;">{story_blocks}</div>

  {jargon_block}

  <div style="background:#18160f;padding:24px 40px;text-align:center;font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,.3);line-height:1.9;">
    <div style="color:rgba(255,255,255,.65);font-size:14px;font-family:Georgia,serif;margin-bottom:6px;">
      Neural <span style="color:#c13d18;">Brief</span>
    </div>
    Weekly AI news for students &middot; Free forever &middot; Every Friday<br>
    <a href="{WEBSITE}/api/unsubscribe?email={email}" style="color:rgba(255,255,255,.25);text-decoration:none;">Unsubscribe</a>
    &nbsp;&middot;&nbsp;
    <a href="{WEBSITE}" style="color:rgba(255,255,255,.25);text-decoration:none;">Website</a>
  </div>

</div>
</body>
</html>"""


# ── Step 5: Get subscribers ──────────────────────────────────
def get_subscribers():
    resp   = supabase.table("subscribers").select("email").eq("confirmed", True).execute()
    emails = [r["email"] for r in resp.data]
    print(f"  📬 {len(emails)} confirmed subscribers")
    return emails


# ── Step 6: Send via Brevo SMTP ──────────────────────────────
def send_emails(subscribers, result, subject, brief_num):
    sent = failed = 0
    try:
        server = smtplib.SMTP(BREVO_SMTP_HOST, BREVO_SMTP_PORT)
        server.starttls()
        server.login(BREVO_SMTP_LOGIN, BREVO_SMTP_KEY)
        for email in subscribers:
            try:
                html = build_html(result, brief_num, email)
                msg  = MIMEMultipart("alternative")
                msg["Subject"]  = subject
                msg["From"]     = FROM_EMAIL
                msg["To"]       = email
                msg["Reply-To"] = REPLY_TO
                msg.attach(MIMEText(html, "html"))
                server.sendmail(FROM_EMAIL, email, msg.as_string())
                sent += 1
                print(f"  ✅ {email}")
            except Exception as e:
                failed += 1
                print(f"  ❌ {email}: {e}")
        server.quit()
    except Exception as e:
        print(f"  ❌ SMTP connection failed: {e}")
    print(f"\n  📊 Sent: {sent} | Failed: {failed}")
    return sent, failed


# ── Issue number ─────────────────────────────────────────────
def next_issue():
    try:
        r = supabase.table("config").select("value").eq("key", "brief_number").execute()
        if r.data:
            n = int(r.data[0]["value"]) + 1
            supabase.table("config").update({"value": str(n)}).eq("key", "brief_number").execute()
            return n
        supabase.table("config").insert({"key": "brief_number", "value": "1"}).execute()
        return 1
    except Exception:
        return 1


# ── Main ─────────────────────────────────────────────────────
def run():
    print("\n🧠 Neural Brief — Weekly digest starting\n" + "="*48)

    print("\n[1/5] Fetching this week's stories...")
    stories = fetch_stories(max_per_feed=10)
    if not stories:
        print("❌ No stories fetched."); return

    print("\n[2/5] Filtering already-sent stories...")
    fresh = filter_seen(stories)

    print("\n[3/5] Groq: selecting top 15 + all new features...")
    result = select_and_summarise(fresh if len(fresh) >= STORIES_COUNT else stories)

    print("\n[4/5] Building email + fetching subscribers...")
    brief_num = next_issue()
    subject   = f"Neural Brief #{brief_num} — This week in AI 🧠"

    # Save preview
    preview_html = build_html(result, brief_num, "preview@example.com")
    with open("preview_email.html", "w", encoding="utf-8") as f:
        f.write(preview_html)
    print(f"  💾 Saved preview_email.html — open in browser to check!")

    subscribers = get_subscribers()
    if not subscribers:
        print("  ⚠️  No subscribers yet."); return

    print(f"\n[5/5] Sending via Brevo SMTP...")
    send_emails(subscribers, result, subject, brief_num)

    print("\n[6/6] Marking stories as sent...")
    mark_sent(result["stories"])

    print("\n[7/7] Saving to digest_cache (for new subscribers)...")
    try:
        # Clear old cache first
        supabase.table("digest_cache").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        # Save fresh cache
        supabase.table("digest_cache").insert({
            "data": result,
        }).execute()
        print("  ✅ Saved to digest_cache!")
    except Exception as e:
        print(f"  ⚠️  Cache save failed (non-critical): {e}")

    print("\n✅ Done! Neural Brief weekly digest delivered.\n")


if __name__ == "__main__":
    run()