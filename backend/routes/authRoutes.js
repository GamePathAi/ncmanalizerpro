const express = require('express');
const router = express.Router();
const authController = require('../auth/authController');
const { authenticate, authenticateEmailVerified, optionalAuth } = require('../middleware/authMiddleware');

// =====================================================
// ROTAS DE AUTENTICAÇÃO COM ESTADOS DE USUÁRIO
// =====================================================

/**
 * @route POST /auth/register
 * @desc Registrar novo usuário (estado: pending_email)
 * @access Public
 * @body { email, password, fullName }
 */
router.post('/register', authController.register);

/**
 * @route POST /auth/verify-email
 * @desc Verificar email com token (pending_email -> pending_subscription)
 * @access Public
 * @body { token }
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @route POST /auth/login
 * @desc Login (permite pending_subscription e active)
 * @access Public
 * @body { email, password }
 */
router.post('/login', authController.login);

/**
 * @route POST /auth/resend-verification
 * @desc Reenviar email de verificação
 * @access Public
 * @body { email }
 */
router.post('/resend-verification', authController.resendVerification);

/**
 * @route GET /auth/me
 * @desc Obter dados do usuário atual e seu estado
 * @access Private (qualquer usuário autenticado)
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route POST /auth/logout
 * @desc Logout do usuário
 * @access Private
 */
router.post('/logout', optionalAuth, authController.logout);

/**
 * @route GET /auth/check-state
 * @desc Verificar estado atual do usuário (helper para frontend)
 * @access Private
 */
router.get('/check-state', authenticate, (req, res) => {
  const userProfile = req.userProfile;
  
  res.json({
    success: true,
    user: {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      subscription_status: userProfile.subscription_status,
      subscription_plan: userProfile.subscription_plan,
      subscription_expires_at: userProfile.subscription_expires_at,
      email_verified_at: userProfile.email_verified_at
    },
    permissions: {
      can_access_dashboard: userProfile.subscription_status === 'active',
      can_access_pricing: ['pending_subscription', 'active'].includes(userProfile.subscription_status),
      needs_email_verification: userProfile.subscription_status === 'pending_email',
      needs_subscription: userProfile.subscription_status === 'pending_subscription'
    },
    redirect_to: getRedirectPath(userProfile.subscription_status)
  });
});

/**
 * @route GET /auth/states
 * @desc Obter informações sobre todos os estados possíveis (helper para frontend)
 * @access Public
 */
router.get('/states', (req, res) => {
  res.json({
    success: true,
    states: {
      pending_email: {
        name: 'Aguardando Verificação de Email',
        description: 'Usuário se cadastrou mas não confirmou email',
        access: 'Apenas tela de confirmação de email',
        actions: ['Reenviar email de confirmação'],
        redirect: '/auth/verify-email'
      },
      pending_subscription: {
        name: 'Aguardando Assinatura',
        description: 'Email confirmado mas sem assinatura ativa',
        access: 'Pode fazer login, mas vê apenas pricing/checkout',
        actions: ['Assinar planos via Stripe Checkout'],
        redirect: '/pricing'
      },
      active: {
        name: 'Ativo',
        description: 'Email confirmado + assinatura ativa',
        access: 'Dashboard completo liberado',
        actions: ['Usar todas as funcionalidades'],
        redirect: '/dashboard'
      }
    },
    flow: [
      'Cadastro → pending_email → envia email',
      'Verificação → pending_subscription → libera pricing',
      'Assinatura → active → libera dashboard'
    ]
  });
});

// Helper function
function getRedirectPath(subscriptionStatus) {
  switch (subscriptionStatus) {
    case 'pending_email':
      return '/auth/verify-email';
    case 'pending_subscription':
      return '/pricing';
    case 'active':
      return '/dashboard';
    default:
      return '/auth/login';
  }
}

module.exports = router;