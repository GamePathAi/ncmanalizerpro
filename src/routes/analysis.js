import express from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Middleware de autenticação (adaptado para status active)
const authenticateActive = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase.from('users').select('*').eq('id', decoded.userId).single();
    if (!user || user.subscription_status !== 'active') return res.status(403).json({ error: 'Acesso negado' });
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
};

// POST /analysis/save
router.post('/save', authenticateActive, async (req, res) => {
  try {
    const { name, data } = req.body;
    const { data: analysis, error } = await supabase
      .from('ncm_analyses')
      .insert({ user_id: req.user.id, analysis_name: name, analysis_data: data, status: 'completed' })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analysis/list
router.get('/list', authenticateActive, async (req, res) => {
  try {
    const { data: analyses, error } = await supabase
      .from('ncm_analyses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, analyses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analysis/:id
router.get('/:id', authenticateActive, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: analysis, error } = await supabase
      .from('ncm_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    if (error) throw error;
    if (!analysis) return res.status(404).json({ error: 'Análise não encontrada' });
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /analysis/:id
router.delete('/:id', authenticateActive, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('ncm_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analysis/suggestion?ncm=xxx
router.get('/suggestion', authenticateActive, async (req, res) => {
  try {
    const { ncm } = req.query;
    if (!ncm) return res.status(400).json({ error: 'NCM requerido' });
    const { data: suggestion, error } = await supabase
      .from('ncm_suggestions')
      .select('*')
      .eq('current_ncm', ncm)
      .single();
    if (error) throw error;
    res.json({ success: true, suggestion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analysis/ncm?code=xxx
router.get('/ncm', authenticateActive, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Código NCM requerido' });
    const { data: ncmInfo, error } = await supabase
      .from('ncm_official')
      .select('*')
      .eq('codigo', code)
      .single();
    if (error) throw error;
    if (!ncmInfo) return res.status(404).json({ error: 'NCM não encontrado' });
    res.json({ success: true, ncm: ncmInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;