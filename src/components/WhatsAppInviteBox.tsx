import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, ExternalLink } from 'lucide-react'

interface WhatsAppInviteBoxProps {
  sessionTitle: string
  publicLink: string
}

export const WhatsAppInviteBox: React.FC<WhatsAppInviteBoxProps> = ({ 
  sessionTitle, 
  publicLink 
}) => {
  const getWhatsAppGroupCode = (): string => {
    // Recupera il codice gruppo dalle localStorage
    return localStorage.getItem('whatsapp_group_code') || ''
  }

  const generateWhatsAppMessage = (): string => {
    const message = `Ciao ragazzi! Sessione di allenamento "${sessionTitle}" preparata, registratevi qui ${publicLink}`
    return encodeURIComponent(message)
  }

  const generateWhatsAppLink = (): string => {
    const groupCode = getWhatsAppGroupCode()
    
    if (!groupCode) {
      // Se non c'è il codice gruppo, usa il link generico con messaggio
      const message = generateWhatsAppMessage()
      return `https://wa.me/?text=${message}`
    }
    
    // Per ora WhatsApp non supporta messaggi preimpostati per i gruppi
    // Quindi usiamo il link generico che permette di selezionare il gruppo
    const message = generateWhatsAppMessage()
    return `https://wa.me/?text=${message}`
  }

  const handleWhatsAppClick = () => {
    const whatsappLink = generateWhatsAppLink()
    window.open(whatsappLink, '_blank')
  }

  const getWhatsAppGroupLink = (): string | null => {
    const groupCode = getWhatsAppGroupCode()
    if (!groupCode) return null
    return `https://chat.whatsapp.com/${groupCode}`
  }

  const groupCode = getWhatsAppGroupCode()

  if (!groupCode) {
    return (
      <Card className="border-amber-200 bg-amber-50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-amber-800">
            <MessageCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Invito WhatsApp non configurato</p>
              <p className="text-sm text-amber-600">
                Configura il codice gruppo WhatsApp nelle impostazioni per abilitare gli inviti automatici.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const groupLink = getWhatsAppGroupLink()

  return (
    <Card className="border-green-200 bg-green-50 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <MessageCircle className="h-5 w-5" />
          Invita Gruppo WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-green-700">
            Condividi questa sessione di allenamento con il gruppo WhatsApp della squadra!
          </p>
          
          <div className="bg-white p-3 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Messaggio che verrà inviato:</p>
            <p className="text-sm italic bg-gray-50 p-2 rounded border-l-3 border-green-400">
              "Ciao ragazzi! Sessione di allenamento "{sessionTitle}" preparata, registratevi qui {publicLink}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleWhatsAppClick}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              Invia Messaggio al Gruppo
            </Button>
            
            {groupLink && (
              <Button 
                variant="outline"
                onClick={() => window.open(groupLink, '_blank')}
                className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
              >
                <ExternalLink className="h-4 w-4" />
                Apri Gruppo WhatsApp
              </Button>
            )}
          </div>

          <p className="text-xs text-green-600">
            💡 Il messaggio si aprirà in WhatsApp e potrai selezionare il gruppo della squadra per inviarlo.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}