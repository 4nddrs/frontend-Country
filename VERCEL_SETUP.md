# Configuración de Vercel para Country Club

## ✅ Cambios realizados en el código

### 1. **Archivo de configuración centralizado** (`src/config/app.ts`)
Se creó un archivo que centraliza todas las URLs de la aplicación:
- En **desarrollo**: usa `http://localhost:5173`
- En **producción**: usa `https://hipicacc.vercel.app`

### 2. **URLs actualizadas**
- ✅ `AuthForm.tsx` - Reset de contraseña
- ✅ `ResetPassword.tsx` - Reenvío de email
- ✅ Todas usan `AUTH_REDIRECT_URLS.resetPassword`

---

## 🚀 Configuración en Vercel

### Paso 1: Variables de Entorno

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables** y agrega:

```bash
VITE_APP_SUPABASE_URL=https://dqhtzvkbgjhnjnmcixcp.supabase.co/
VITE_APP_SUPABASE_ANON_KEY=tu-anon-key-aqui
VITE_APP_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

⚠️ **IMPORTANTE**: Usa las mismas keys que tienes en tu `.env` local

### Paso 2: Configurar Supabase Authentication

1. Ve a **Supabase Dashboard** → Tu proyecto → **Authentication** → **URL Configuration**

2. Agrega estas URLs permitidas:

**Site URL**:
```
https://hipicacc.vercel.app
```

**Redirect URLs** (una por línea):
```
https://hipicacc.vercel.app
https://hipicacc.vercel.app/reset-password
https://hipicacc.vercel.app/*
http://localhost:5173
http://localhost:5173/reset-password
```

3. Guarda los cambios

### Paso 3: Verificar configuración de Email Templates

En **Supabase Dashboard** → **Authentication** → **Email Templates**:

1. **Reset Password** template:
   - Verifica que use `{{ .ConfirmationURL }}` 
   - Este link ya incluirá automáticamente `https://hipicacc.vercel.app/reset-password`

2. **Confirm Signup** template (si aplica):
   - Similar, usa `{{ .ConfirmationURL }}`

---

## 🧪 Cómo probar

### En desarrollo (local):
```bash
npm run dev
# Debería usar: http://localhost:5173
```

### En producción (Vercel):
```bash
# Después de hacer push
git add .
git commit -m "config: Configurar dominio de producción para Vercel"
git push
```

1. Ve a `https://hipicacc.vercel.app`
2. Haz clic en "¿Olvidaste la contraseña?"
3. Ingresa tu email
4. Verifica que el email llegue con el link correcto: `https://hipicacc.vercel.app/reset-password?token=...`

---

## 📝 Archivos modificados

- ✅ `src/config/app.ts` - Creado (configuración centralizada)
- ✅ `src/components/AuthForm.tsx` - Actualizado (usa AUTH_REDIRECT_URLS)
- ✅ `src/pages/ResetPassword.tsx` - Actualizado (usa AUTH_REDIRECT_URLS)
- ✅ `.env.example` - Creado (template de variables de entorno)
- ✅ `vercel.json` - Ya configurado (rewrites para SPA)

---

## ⚠️ Recordatorios importantes

1. **No subas el `.env` al repositorio** (ya está en `.gitignore`)
2. **Configura las variables en Vercel** manualmente
3. **Actualiza las Redirect URLs en Supabase** con el dominio de producción
4. **Si cambias el dominio**, solo actualiza `src/config/app.ts`

---

## 🎯 Resultado esperado

✅ Reset de contraseña funciona en producción  
✅ URLs correctas tanto en desarrollo como producción  
✅ Emails de Supabase redirigen al dominio correcto  
✅ Sin conflictos entre pestañas  
✅ Sin errores 404 al cerrar sesión

---

## 🆘 Troubleshooting

### "Email not sent" en producción
- Verifica que las variables de entorno estén en Vercel
- Verifica que las Redirect URLs estén en Supabase

### "Invalid redirect URL"
- Verifica que `https://hipicacc.vercel.app/reset-password` esté en la lista de Supabase

### "Link expired"
- Los links de reset duran 1 hora por defecto
- Usuario debe pedir un nuevo link

---

¡Todo listo para producción! 🚀
