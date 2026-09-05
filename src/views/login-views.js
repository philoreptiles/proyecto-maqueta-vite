import { supabase } from '../js/supabase-config.js';

const formLogin = document.getElementById('form-login');
const inputEmail = document.getElementById('login-email');
const inputPassword = document.getElementById('login-password');
const btnLogin = document.getElementById('btn-login');
const errorDiv = document.getElementById('login-error');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      window.location.href = '/src/pages/admin.html';
    }
  } catch (err) {
    console.error('Error al verificar sesión inicial:', err);
  }
});

if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';

    const email = inputEmail.value.trim();
    const password = inputPassword.value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Sesión iniciada con éxito:', data);
      window.location.href = '/src/pages/admin.html';
    } catch (err) {
      console.error('Error en Supabase Auth:', err);
      if (errorDiv) {
        errorDiv.textContent = 'Error de acceso: ' + (err.message || 'Credenciales inválidas');
        errorDiv.style.display = 'block';
      }
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = '🔑 Iniciar Sesión';
    }
  });
}