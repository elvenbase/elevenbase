import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

interface WhatsAppInviteBoxProps {
  sessionTitle: string
  publicLink: string
}

export const WhatsAppInviteBox: React.FC<WhatsAppInviteBoxProps> = ({ 
  sessionTitle, 
  publicLink 
}) => {
  const generateWhatsAppMessage = (): string => {
    const message = `Ciao ragazzi! Sessione di allenamento "${sessionTitle}" preparata, registratevi qui ${publicLink}`
    return encodeURIComponent(message)
  }

  const generateWhatsAppLink = (): string => {
    const message = generateWhatsAppMessage()
    return `https://wa.me/?text=${message}`
  }

  const handleWhatsAppClick = () => {
    const whatsappLink = generateWhatsAppLink()
    window.open(whatsappLink, '_blank')
  }

  return (
    <Card className="border-green-200 bg-green-50 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <MessageCircle className="h-5 w-5" />
          Condividi su WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-green-700">
            Condividi questa sessione di allenamento con la squadra via WhatsApp!
          </p>
          
          <div className="bg-white p-3 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Messaggio che verrà inviato:</p>
            <p className="text-sm italic bg-gray-50 p-2 rounded border-l-3 border-green-400">
              "Ciao ragazzi! Sessione di allenamento "{sessionTitle}" preparata, registratevi qui {publicLink}"
            </p>
          </div>

          <Button 
            onClick={handleWhatsAppClick}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" />
            Condividi su WhatsApp
          </Button>

          <p className="text-xs text-green-600">
            💡 Il messaggio si aprirà in WhatsApp e potrai scegliere con chi condividerlo (contatto o gruppo).
          </p>
        </div>
      </CardContent>
    </Card>
  )
}