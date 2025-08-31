import classnames from 'classnames';

import haszariProfilePic from '../assets/haszari.jpg';

/*
Using a React component for this page temporarily, 
since it's implemented as a React nest in Gatsby site.
Long term can switch this to mdx or something lighter.
*/

// These icon elements would be good to factor out 
// to reusable components.

function PlatformIcon({ platform, url }) {
  return (<a className='PlatformIcon' href={url}>
    <span className={`icon-${platform}`}></span>
  </a>);
}

function SocialIconsGroup({ title, className, items }) {
  const social = items.map(({url, key}) => {
    if (!key || !url) {return};
    return ( url && <PlatformIcon key={key} platform={key} url={url} />);
  });

  const classes = classnames([
    'SocialIcons',
    className
  ]);
  

  return (
    <div className={classes}>
      <h4>{title}</h4>
      <div className="Icons">
        {social}
      </div>
    </div>
  )
}

const HaszariPage = ({data}) => {
  // const profilePic = getImage( data?.allFile?.nodes[0] );

  // console.log(JSON.stringify(data));

  const { socialLinks } = data;
  const socialPlatforms = [
    "instagram",
    "youtube",
    "bluesky",
    "facebook",
    "mastodon",
    "tiktok",
  ];
  const social = socialPlatforms.map((key) => {
    if (!key) {return};
    const url = socialLinks[key];
    return ( url && { key, url } );
  });
  const listenPlatforms = [
    "bandcamp",
    "soundcloud",
    "apple",
    "spotify",
    "beatport",
    "youtube",  
  ];
  const listen = listenPlatforms.map((key) => {
    if (!key) {return};
    const url = socialLinks[key];
    return ( url && { key, url } );
  });

  const musicIcons = (<SocialIconsGroup title='Listen' items={listen} />);

  const socialIcons = (<SocialIconsGroup title='Follow' items={social} />);

  return (
		<>
			<h1>Haszari</h1>
      <div className="ProfilePic">
        <img src={haszariProfilePic.src} />
      </div>
      <div className='Links'>
        { musicIcons }
      </div>

      <div className="Row-flip">
        <div className="Media">
          <iframe loading="lazy" height="314" width="400"  scrolling="no" frameBorder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1672812102&amp;color=%230c0404&amp;auto_play=true&amp;hide_related=false&amp;show_comments=false&amp;show_user=false&amp;show_reposts=false&amp;show_teaser=false&amp;visual=true"></iframe>
        </div>
        <div className="Copy">
          <p>My sets weave through minimal, techno, and house – eclectic with a consistent groove. Never too serious to get down.</p>
        </div>
      </div>

      <div className="Row">
        <div className="Media">
          <iframe width="100%" height="352" src="https://open.spotify.com/embed/playlist/0hGwn4tIEtJXtzLF9Uihy5?utm_source=generator" frameborder="0" allowFullScreen="" allow="autoplay; clipboard-write; encrypted-Media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>
        <div className="Copy">
          <p>My original music is all about the space between sounds.</p>
          <p>You might classify it as tech-house, dub, ambient or breakbeat.</p>
        </div>
      </div>

      <div className='Links'>
        { socialIcons } 
      </div>

      <div className="Row-flip">
        <div className="Media YouTube">
          <iframe width="480" src="https://www.youtube.com/embed/RQ6fk0km2xM?si=yVRQyJa-RGZQXHLz" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <div className="Copy">
          <p>I’m obsessed with the challenge of playing electronic music live.</p>
        </div>
      </div>

      <div className="Row center">
        <p>I release interesting music by my friends on <a href="/">Cartoon Beats Reality</a>.</p>
      </div>
      
    </>
  )
}

export default HaszariPage;