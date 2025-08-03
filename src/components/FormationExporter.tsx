
import React from 'react'
import { useJerseyTemplates } from '@/hooks/useJerseyTemplates'

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
}

const FormationExporter = ({ lineup, formation, sessionTitle, teamName, jerseyUrl }: FormationExporterProps) => {
  const { defaultJersey } = useJerseyTemplates()
  
  // Usa jerseyUrl se fornito, altrimenti la maglia di default, altrimenti fallback
  const currentJerseyUrl = jerseyUrl || defaultJersey?.image_url || '/lovable-uploads/jersey-example.png'
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
          border: '3px solid #000',
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
            height: '2px',
            backgroundColor: '#000',
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
            border: '2px solid #000',
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
            border: '2px solid #000',
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
            border: '2px solid #000',
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
            border: '2px solid #000',
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
            border: '2px solid #000',
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
              {/* Maglietta */}
              <div 
                style={{
                  width: '110px', // Maglia quadrata 110x110px
                  height: '110px', // Maglia quadrata 110x110px
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
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '28px', // Font proporzionato per maglia 110px
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9), 1px -1px 2px rgba(0,0,0,0.9), -1px 1px 2px rgba(0,0,0,0.9)'
                }}>
                  {player.jersey_number || '?'}
                </span>
              </div>

              {/* Nome giocatore su due righe */}
              <div 
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  padding: '5px 8px', // 5px alto e basso, 8px laterali
                  borderRadius: '4px',
                  fontSize: '12px', // Font proporzionato per maglia più piccola
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '110px', // Stesso width della maglia per perfetta centratura
                  border: '1px solid #000',
                  lineHeight: '1.1'
                }}
              >
                <div>
                  {player.first_name.toUpperCase()}
                </div>
                <div>
                  {player.last_name.toUpperCase()}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FormationExporter
