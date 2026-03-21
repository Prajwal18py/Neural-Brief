// api/get-archive.js
// Returns all past Neural Brief issues from digest_archive table

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { id } = req.query

  try {
    // Single brief requested
    if (id) {
      const { data, error } = await supabase
        .from('digest_archive')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) return res.status(404).json({ error: 'Brief not found' })
      return res.status(200).json(data)
    }

    // All briefs list
    const { data, error } = await supabase
      .from('digest_archive')
      .select('id, brief_num, created_at, biggest_move, jargon')
      .order('created_at', { ascending: false })

    if (error) throw error
    return res.status(200).json({ briefs: data || [] })

  } catch (err) {
    console.error('Archive error:', err)
    return res.status(500).json({ error: err.message })
  }
}