// Servidor Express para o sistema de autenticação NCM PRO
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
// const analysisRoutes = await import('./src/routes/analysis.js').then(m => m.default || m);

// Configurar dotenv
dotenv.config();

// Obter __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rotas do backend (CommonJS usando import dinâmico)
const { createRequire } = await import('module');
const require = createRequire(import.meta.url);

const authController = require('./backend/auth/authController.cjs');
const stripeRoutes = require('./backend/routes/stripeRoutes.cjs');
const webhookRoutes = require('./backend/webhooks/stripeWebhook.cjs');

// Criar router para autenticação
const authRoutes = express.Router();
authRoutes.post('/register', authController.register);
authRoutes.post('/verify-email', authController.verifyEmail);
authRoutes.post('/login', authController.login);
authRoutes.post('/resend-verification', authController.resendVerification);
authRoutes.get('/me', authController.getMe);
authRoutes.post('/logout', authController.logout);

// Configurar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para webhooks (deve vir antes do express.json())
// O webhook do Stripe precisa do raw body
app.use('/api/webhook', webhookRoutes);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://ncmanalyzerpro.com.br', 'https://www.ncmanalyzerpro.com.br']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Disponibilizar cliente Supabase para as rotas
app.locals.supabase = supabase;

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
// app.use('/api/analysis', analysisRoutes);

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Rota de teste do Supabase
app.get('/api/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      status: 'Supabase connected successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Supabase connection error:', error);
    res.status(500).json({ 
      status: 'Supabase connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Catch-all handler: enviar de volta o React app
  app.get('*', (req, res) => {
    // Não interceptar rotas da API
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  // Erro de validação
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details
    });
  }
  
  // Erro do Stripe
  if (error.type && error.type.startsWith('Stripe')) {
    return res.status(400).json({
      error: 'Payment Error',
      message: error.message
    });
  }
  
  // Erro genérico
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor NCM PRO rodando na porta ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`💳 Webhooks: http://localhost:${PORT}/api/webhook`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Supabase Test: http://localhost:${PORT}/api/test-supabase`);
  console.log(`\n📋 Rotas disponíveis:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/verify-email`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/resend-verification`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   POST /api/auth/logout`);
  console.log(`   POST /api/stripe/create-checkout-session`);
  console.log(`   POST /api/stripe/create-portal-session`);
  console.log(`   GET  /api/stripe/subscription`);
  console.log(`   POST /api/webhook/stripe`);
  console.log(`\n🔐 Estados de usuário suportados:`);
  console.log(`   - pending_email: Aguardando confirmação de email`);
  console.log(`   - pending_subscription: Email confirmado, aguardando assinatura`);
  console.log(`   - active: Sistema completo liberado`);
  console.log(`\n✅ Sistema de autenticação com estados implementado com sucesso!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM, encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT, encerrando servidor graciosamente...');
  process.exit(0);
});

export default app;