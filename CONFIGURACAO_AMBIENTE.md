# Configuração do Ambiente

Este arquivo contém instruções para configurar as variáveis de ambiente necessárias para o funcionamento completo do sistema.

## Variáveis Necessárias

### Firebase Client (Obrigatório)

Estas variáveis são usadas no lado do cliente (navegador):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Como obter:**
1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em Configurações do Projeto (ícone de engrenagem) → Geral
4. Role até "Seus aplicativos" e copie os valores

### Firebase Admin SDK (Opcional, mas recomendado)

Esta variável é usada no lado do servidor para verificação de roles:

```env
GOOGLE_APPLICATION_CREDENTIALS_BASE64=
```

**Como obter:**

1. No Firebase Console, vá em Configurações do Projeto → Contas de Serviço
2. Clique em "Gerar nova chave privada"
3. Salve o arquivo JSON baixado
4. Converta para Base64:

**No Linux/Mac:**
```bash
cat serviceAccountKey.json | base64 -w 0
```

**No Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content serviceAccountKey.json -Raw)))
```

5. Cole o resultado na variável `GOOGLE_APPLICATION_CREDENTIALS_BASE64`

## Arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com suas variáveis:

```bash
cp .env.example .env.local
```

Depois edite `.env.local` e substitua os valores de exemplo pelos seus valores reais.

## Comportamento sem Firebase Admin

⚠️ **IMPORTANTE**: O sistema funciona parcialmente sem o Firebase Admin SDK configurado:

- ✅ Login funciona normalmente
- ✅ Usuários podem acessar suas respectivas áreas
- ⚠️ Todos os usuários são tratados como "escola" por padrão
- ❌ Verificação de role "admin" no servidor não funciona completamente

Para funcionalidade completa de controle de acesso baseado em roles, **configure o Firebase Admin SDK**.

## Verificação

Após configurar as variáveis, reinicie o servidor de desenvolvimento:

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

Verifique os logs do terminal:
- ✅ Se aparecer: "Firebase Admin initialized" → Configurado corretamente
- ⚠️ Se aparecer: "GOOGLE_APPLICATION_CREDENTIALS_BASE64 env var not set" → Admin não configurado (funcionalidade limitada)
