import * as React from "react"

import "./ArtistDirectory.scss"

const MIN_FONT_SIZE = 0.8
const MAX_FONT_SIZE = 2.5

function getTagSize(count, minCount, maxCount) {
  if (minCount === maxCount) return (MIN_FONT_SIZE + MAX_FONT_SIZE) / 2
  const ratio = (count - minCount) / (maxCount - minCount)
  return MIN_FONT_SIZE + ratio * (MAX_FONT_SIZE - MIN_FONT_SIZE)
}

function ArtistDirectory({ artists }) {
  const [activeStyle, setActiveStyle] = React.useState(null)

  const styleCounts = {}
  for (const entry of artists) {
    if (entry.styles) {
      for (const style of entry.styles) {
        styleCounts[style] = (styleCounts[style] || 0) + 1
      }
    }
  }

  const sortedStyles = Object.keys(styleCounts).sort()
  const counts = Object.values(styleCounts)
  const minCount = Math.min(...counts)
  const maxCount = Math.max(...counts)

  const filteredArtists = activeStyle
    ? artists.filter((entry) => entry.styles && entry.styles.includes(activeStyle))
    : artists

  return (
    <div className="ArtistDirectory">
      <div className="ArtistDirectory-tags">
        {activeStyle && (
          <button
            className="ArtistDirectory-tagPill"
            onClick={() => setActiveStyle(null)}
          >
            <span className="ArtistDirectory-tagLabel">✕ clear</span>
          </button>
        )}
        {sortedStyles.map((style) => (
          <span
            key={style}
            className={`ArtistDirectory-tagPill${style === activeStyle ? " is-active" : ""}`}
          >
            <button
              className="ArtistDirectory-tagLabel"
              onClick={() => setActiveStyle(style === activeStyle ? null : style)}
              style={{
                fontSize: `${getTagSize(styleCounts[style], minCount, maxCount)}rem`,
              }}
            >
              {style}
              <span className="ArtistDirectory-tagCount">{styleCounts[style]}</span>
            </button>
          </span>
        ))}
      </div>

      <div className="ArtistDirectory-artists">
        {filteredArtists.map((entry) => (
          <span key={entry.artist}>
            <strong>{entry.artist}</strong>
          </span>
        ))}
      </div>

      {filteredArtists.length === 0 && (
        <p>No artists match this style.</p>
      )}
    </div>
  )
}

export default ArtistDirectory
