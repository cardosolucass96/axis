# Configuração de Autenticação com Google OAuth

## Pré-requisitos

1. Uma conta Google
2. Acesso ao Google Cloud Console

## Passos para configurar

### 1. Criar projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o nome do projeto

### 2. Habilitar Google+ API

1. No menu lateral, vá em **APIs e Serviços** > **Biblioteca**
2. Busque por "Google+ API" ou "Google Identity"
3. Clique em **Ativar**

### 3. Configurar Tela de Consentimento OAuth

1. Vá em **APIs e Serviços** > **Tela de consentimento OAuth**
2. Selecione **Externo** (ou Interno se for G Suite)
3. Preencha as informações:
   - Nome do aplicativo: `Axis`
   - E-mail de suporte: seu email
   - Domínios autorizados: `localhost` (para dev)
4. Em **Escopos**, adicione:
   - `email`
   - `profile`
   - `openid`
5. Salve

### 4. Criar Credenciais OAuth 2.0

1. Vá em **APIs e Serviços** > **Credenciais**
2. Clique em **Criar Credenciais** > **ID do cliente OAuth**
3. Tipo de aplicativo: **Aplicativo da Web**
4. Nome: `Axis Web`
5. **Origens JavaScript autorizadas**:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
6. **URIs de redirecionamento autorizados**:
   ```
   http://localhost:3000/auth/google/callback
   ```
7. Clique em **Criar**
8. **Copie o Client ID e Client Secret**

### 5. Configurar variáveis de ambiente

Edite o arquivo `backend/.env`:

```env
GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## Rotas de Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/auth/google` | Inicia fluxo OAuth |
| GET | `/auth/google/callback` | Callback do Google |
| GET | `/auth/me` | Retorna usuário logado |
| POST | `/auth/logout` | Faz logout |

## Fluxo de Autenticação

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────►│   Backend   │────►│   Google    │
│  (React)    │     │  (Fastify)  │     │   OAuth     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
      │  1. Click Login    │                   │
      │───────────────────►│                   │
      │                    │  2. Redirect      │
      │                    │──────────────────►│
      │                    │                   │
      │                    │  3. User consents │
      │                    │◄──────────────────│
      │                    │                   │
      │  4. Session Cookie │                   │
      │◄───────────────────│                   │
      │                    │                   │
      │  5. Redirect home  │                   │
      │◄───────────────────│                   │
```

## Uso no Frontend

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <button onClick={login}>Login com Google</button>;
  }

  return (
    <div>
      <p>Olá, {user.name}!</p>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

## Protegendo Rotas no Backend

```typescript
import { requireAuth, requireAdmin } from './middleware/auth';

// Rota protegida (requer login)
app.get('/api/protected', { preHandler: requireAuth }, async (request) => {
  return { user: request.user };
});

// Rota apenas para admin
app.get('/api/admin', { preHandler: requireAdmin }, async (request) => {
  return { message: 'Só admins veem isso' };
});
```

## Troubleshooting

### Erro "redirect_uri_mismatch"
- Verifique se a URI de redirecionamento no Google Cloud Console está **exatamente** igual à do `.env`
- Não esqueça de incluir o protocolo (`http://` ou `https://`)

### Erro "access_denied"
- Verifique se o app está no modo de teste e seu email está na lista de usuários de teste
- Ou publique o app no Google Cloud Console

### Cookie não está sendo enviado
- Verifique se `credentials: 'include'` está nas requisições fetch
- Verifique se CORS está configurado com `credentials: true`
