
import React from 'react'
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates'
import { useAvatarColor } from '@/hooks/useAvatarColor'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number?: number
}

interface LineupPlayer {
  player_id: string
  position_x: number
  position_y: number
  player?: Player
}

interface Formation {
  name: string
  positions: Array<{ x: number; y: number }>
}

interface FormationExporterProps {
  lineup: LineupPlayer[]
  formation: Formation
  sessionTitle: string
  teamName?: string
  jerseyUrl?: string
  fieldLinesColor?: string
  fieldLinesThickness?: number
  jerseyNumbersColor?: string
  jerseyNumbersShadow?: string
  usePlayerAvatars?: boolean
  nameBoxColor?: string
  nameTextColor?: string
}

const FormationExporter = ({ 
  lineup, 
  formation, 
  sessionTitle, 
  teamName, 
  jerseyUrl,
  fieldLinesColor = '#000000',
  fieldLinesThickness = 2,
  jerseyNumbersColor = '#000000',
  jerseyNumbersShadow = '2px 2px 4px rgba(0,0,0,0.9)',
  usePlayerAvatars = false,
  nameBoxColor = '#ffffff',
  nameTextColor = '#000000'
}: FormationExporterProps) => {
  const { defaultJersey } = useJerseyTemplates()
  const { getAvatarBackground } = useAvatarColor()
  
  // Usa jerseyUrl se fornito, altrimenti la maglia di default, altrimenti fallback
  const currentJerseyUrl = jerseyUrl || defaultJersey?.image_url || '/lovable-uploads/jersey-example.png'



  // Funzione per ottenere le iniziali del giocatore
  const getPlayerInitials = (player: Player) => {
    return `${player.first_name.charAt(0)}${player.last_name.charAt(0)}`
  }

  // Funzione per estrarre il colore di sfondo dall'ombra
  const getShadowBackgroundColor = (shadow: string) => {
    if (shadow === 'none') return 'rgba(0,0,0,0.9)'
    
    // Estrai il colore dall'ombra
    const colorMatch = shadow.match(/rgba?\([^)]+\)/)
    if (colorMatch) {
      return colorMatch[0]
    }
    
    // Fallback per ombre non standard
    if (shadow.includes('rgba(0,0,0')) return 'rgba(0,0,0,0.9)'
    if (shadow.includes('rgba(255,255,255')) return 'rgba(255,255,255,0.9)'
    if (shadow.includes('rgb(0,0,0')) return 'rgba(0,0,0,0.9)'
    if (shadow.includes('rgb(255,255,255')) return 'rgba(255,255,255,0.9)'
    
    return 'rgba(0,0,0,0.9)' // Fallback default
  }
  return (
    <div 
      id="formation-export"
      className="bg-transparent"
      style={{
        width: '600px',
        height: '900px',
        position: 'relative',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Campo da calcio verticale */}
      <div 
        className="relative"
        style={{
          width: '100%',
          height: '100%',
          border: `${fieldLinesThickness}px solid ${fieldLinesColor}`,
          borderRadius: '8px',
          background: 'transparent'
        }}
      >
        {/* Linea di metà campo */}
        <div 
          style={{
            position: 'absolute',
            left: '0',
            right: '0',
            top: '50%',
            height: `${fieldLinesThickness}px`,
            backgroundColor: fieldLinesColor,
            transform: 'translateY(-50%)'
          }}
        />
        
        {/* Cerchio di centro campo */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '120px',
            height: '120px',
            border: `${fieldLinesThickness}px solid ${fieldLinesColor}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'transparent'
          }}
        />

        {/* Area di rigore in alto */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            top: '0',
            width: '200px',
            height: '80px',
            border: `${fieldLinesThickness}px solid ${fieldLinesColor}`,
            borderTop: 'none',
            transform: 'translateX(-50%)',
            background: 'transparent'
          }}
        />

        {/* Area di rigore in basso */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '0',
            width: '200px',
            height: '80px',
            border: `${fieldLinesThickness}px solid ${fieldLinesColor}`,
            borderBottom: 'none',
            transform: 'translateX(-50%)',
            background: 'transparent'
          }}
        />

        {/* Area piccola in alto */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            top: '0',
            width: '100px',
            height: '40px',
            border: `${fieldLinesThickness}px solid ${fieldLinesColor}`,
            borderTop: 'none',
            transform: 'translateX(-50%)',
            background: 'transparent'
          }}
        />

        {/* Area piccola in basso */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '0',
            width: '100px',
            height: '40px',
            border: `${fieldLinesThickness}px solid ${fieldLinesColor}`,
            borderBottom: 'none',
            transform: 'translateX(-50%)',
            background: 'transparent'
          }}
        />

        {/* Titolo */}
        <div 
          style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#000',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '18px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          {sessionTitle}
          {teamName && ` - ${teamName}`}
        </div>

        {/* Giocatori */}
        {lineup.map((lineupPlayer) => {
          const player = lineupPlayer.player
          if (!player) return null

          return (
            <div
              key={lineupPlayer.player_id}
              style={{
                position: 'absolute',
                left: `${lineupPlayer.position_x}%`,
                top: `${lineupPlayer.position_y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {/* Maglietta o Avatar */}
              <div 
                style={{
                  width: '110px', // Quadrato 110x110px
                  height: '110px', // Quadrato 110x110px
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                {usePlayerAvatars && (player as any).avatar_url ? (
                  // Avatar del giocatore
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      src={(player as any).avatar_url}
                      alt={`${player.first_name} ${player.last_name}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                      onError={(e) => {
                        // Se l'avatar non carica, mostra il fallback
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    {/* Cerchietto con numero di maglia */}
                    {player.jersey_number && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '5px',
                          right: '5px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: getShadowBackgroundColor(jerseyNumbersShadow),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: jerseyNumbersColor,
                          zIndex: 10
                        }}
                      >
                        {player.jersey_number}
                      </div>
                    )}
                  </div>
                ) : null}
                
                {usePlayerAvatars && !(player as any).avatar_url ? (
                  // Fallback avatar con iniziali
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        ...getAvatarBackground(player.first_name + player.last_name, false),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {getPlayerInitials(player)}
                    </div>
                    {/* Cerchietto con numero di maglia */}
                    {player.jersey_number && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '5px',
                          right: '5px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: getShadowBackgroundColor(jerseyNumbersShadow),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: jerseyNumbersColor,
                          zIndex: 10
                        }}
                      >
                        {player.jersey_number}
                      </div>
                    )}
                  </div>
                ) : null}

                {!usePlayerAvatars && (
                  // Maglia tradizionale
                  <>
                    <img
                      src={currentJerseyUrl}
                      alt="Maglia"
                      style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        zIndex: 1
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/lovable-uploads/jersey-example.png'
                      }}
                    />
                    <span style={{ 
                      position: 'relative', 
                      zIndex: 2, 
                      color: jerseyNumbersColor,
                      fontWeight: 'bold',
                      fontSize: '28px', // Font proporzionato per maglia 110px
                      textShadow: jerseyNumbersShadow,
                      marginTop: '-30px'
                    }}>
                      {player.jersey_number || '?'}
                    </span>
                  </>
                )}
              </div>

              {/* Nome giocatore su due righe */}
              <div 
                style={{
                  backgroundColor: nameBoxColor,
                  color: nameTextColor,
                  fontSize: '12px',
                  fontWeight: 'bold',
                  fontFamily: 'sans-serif',
                  paddingTop: '0px',
                  paddingRight: '15px',
                  paddingBottom: '15px',
                  paddingLeft: '15px',
                  textAlign: 'center'
                }}
              >
                {player.first_name.toUpperCase()}<br/>{player.last_name.toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FormationExporter
