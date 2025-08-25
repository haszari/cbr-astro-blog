import * as React from "react"

import "./ListenIcons.scss"

// url - listen link for store
// store - one of beatport, spotify, apple, amazon, youtube, bandcamp, 
// TODO enforce this with TypeScript?
function ListenIcon({ store, url }) {
  return (<a href={url}>
    <span className={`icon-${store}`}></span>
    <label>listen on {store}</label>
  </a>);
}

function ListenIcons({ links }) {
  let listenElements = Object.keys(links).map(store => {
    const url = links[store];
    return (url && <ListenIcon key={store} store={store} url={url} />);
  });
  
  return (
    <div className="ListenIcons">
      {listenElements}
    </div>
  );
}

export default ListenIcons;