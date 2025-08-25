import * as React from "react"

import HomePageSlantRelease from './HomePageSlantRelease';

// releases[]
// artist
// title
// image
function ReleaseList({ releases }) {
  const rows = releases.map(( { data: releaseInfo, id } ) => ( 
    <HomePageSlantRelease
      key={id}
      coverImage={releaseInfo.cover} 
      title={releaseInfo.title}
      artist={releaseInfo.artist}
      listenLinks={releaseInfo.listenLinks}
      linkToPath={releaseInfo.gatsbyPath}
    />
  ));

  return (
    <div className="ReleaseList">
      { rows }
    </div>
  )
}

export default ReleaseList;
