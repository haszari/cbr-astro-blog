import * as React from "react"

import "./ListenButtons.scss"

function storeIdToLabel(storeName) {
  if (!storeName) {
    return ''
  };

  if (storeName === 'apple') {
    return 'Apple Music';
  }
  if (storeName === 'soundcloud') {
    return 'SoundCloud';
  }
  if (storeName === 'youtube') {
    return 'YouTube';
  }

  return storeName.charAt(0).toUpperCase() + storeName.slice(1);
}

// url - listen link for store
// store - one of beatport, spotify, apple, amazon, youtube, bandcamp, 
// TODO enforce this with TypeScript?
function ListenButton({ store, url }) {
  let labelPrefix = 'Stream on';
  if (store === 'bandcamp') {
    labelPrefix = 'Stream & buy at';
  }
  if (store === 'beatport') {
    labelPrefix = 'Blend at';
  }

  return (<a href={url}>
    <span className={`icon-${store}`}></span>
    <label>{labelPrefix} {storeIdToLabel(store)}</label>
  </a>);
}

function ListenButtons({ links }) {
  let listenElements = Object.keys(links).map(store => {
    const url = links[store];
    return (url && <ListenButton key={store} store={store} url={url} />);
  });
  
  return (
    <div className="ListenButtons">
      {listenElements}
    </div>
  );
}

export default ListenButtons;