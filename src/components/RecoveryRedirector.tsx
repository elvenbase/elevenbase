import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const RecoveryRedirector = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const type = params.get('type')
    if (type === 'recovery' && location.pathname !== '/reset-password') {
      navigate(`/reset-password${location.search}`, { replace: true })
    }
  }, [location, navigate])

  return null
}

export default RecoveryRedirector