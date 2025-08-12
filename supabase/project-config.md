# 🗄️ CA de Rissi Hub - Supabase Project Configuration

## 📋 Project Details
- **Project Name**: CA de Rissi Hub
- **Project ID**: cuthalxqxkonmfzqjdvw
- **Region**: (auto-detected)
- **Database Version**: PostgreSQL 17

## 🔑 API Keys

### Frontend (Public)
```bash
VITE_SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
```

### Backend/Admin (Secret)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUxNzgxMiwiZXhwIjoyMDcwMDkzODEyfQ.vWWnkClhtsd7IUOaeB8BccCVRYrwoV21JjbL-qT_m-4
```

### CLI Access
```bash
SUPABASE_ACCESS_TOKEN=sbp_fa64cfe857dac90f0fc1ffd9b005eb8b47f9e244
SUPABASE_PROJECT_REF=cuthalxqxkonmfzqjdvw
```

## 🌐 URLs

### API Endpoints
- **REST API**: https://cuthalxqxkonmfzqjdvw.supabase.co/rest/v1
- **GraphQL**: https://cuthalxqxkonmfzqjdvw.supabase.co/graphql/v1
- **Realtime**: wss://cuthalxqxkonmfzqjdvw.supabase.co/realtime/v1
- **Storage**: https://cuthalxqxkonmfzqjdvw.supabase.co/storage/v1
- **Auth**: https://cuthalxqxkonmfzqjdvw.supabase.co/auth/v1

### Dashboard
- **Project Dashboard**: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw
- **Database**: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw/sql
- **API Settings**: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw/settings/api

## 🚀 Local Development

### Start Local Supabase
```bash
npm run supabase:start
# or
./scripts/db-manage.sh start
```

### Connect to Remote
```bash
supabase link --project-ref cuthalxqxkonmfzqjdvw
```

### Push Changes
```bash
npm run supabase:db:push
# or
./scripts/db-manage.sh push
```

## 🔒 Security Notes

⚠️ **IMPORTANT**: 
- **Anon Key**: Safe for frontend (public)
- **Service Role Key**: Keep secret, admin only
- **Access Token**: Keep secret, CLI only

## 📱 Environment Variables

### Development (.env)
```bash
VITE_SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
```

### Production (GitHub Secrets)
```bash
SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
SUPABASE_ACCESS_TOKEN=sbp_fa64cfe857dac90f0fc1ffd9b005eb8b47f9e244
```

## 🎯 Next Steps

1. ✅ **Environment configured**
2. ✅ **GitHub Actions ready**
3. ✅ **Local development ready**
4. 🔄 **Deploy to test environment**
5. 🚀 **Go live!**

---

**Last Updated**: $(date)
**Configuration Status**: ✅ Complete