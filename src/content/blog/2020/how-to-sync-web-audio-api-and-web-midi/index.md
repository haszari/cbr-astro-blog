---
title: How to sync the Web Audio API with Web MIDI
pubDate: "2020-04-12T23:09:53"
heroImage: ./images/IMG_3200-scaled-1.jpg
headerImage: ./images/IMG_3200-scaled-1.jpg
---

<!-- 
# imported metadata
# date: '2020-04-12T23:09:53'
# slug: how-to-sync-web-audio-api-and-web-midi
# author: haszari
# status: publish
# comment_status: open
# ping_status: closed
# menu_order: 0
# post_type: post
# comment_count: 0
# guid: https://cartoonbeats.com/?p=495
# featuredImage: images/IMG_3200-scaled-1.jpg
# contains_html: true
 -->


The [Web Audio API](https://www.w3.org/TR/webaudio/) is an incredibly fun [audio playground](http://cartoonbeats.com/padded-landscape/), [widely supported in most browsers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API). You can quite easily do things like build synthesisers and sound effects, or slice up audio samples – in JavaScript code, in your web browser.

There's also a [companion API](https://webaudio.github.io/web-midi-api) for sending and receiving MIDI events. This allows you to play your Web Audio synthesiser using a physical (piano-style) keyboard, or send midi notes and controller information out to play other instruments or devices, either hardware or other software.

I've [been experimenting with these APIs](https://github.com/haszari/kytaime) because I want a more flexible way to sequence and trigger musical parts live.

In my app I have various patterns of music. Some contain audio events - for example a drum beat, made of different drum sounds triggered in Web Audio in the browser. Others contain MIDI events - for example, a bassline. These MIDI patterns are sent out to other synth software - they don't make sound in the browser.

## What's the problem?

When I'm playing my different patterns, I want the notes to line up in sync.

The Web Audio API and Web MIDI API use different scheduling, so things don't line up by default.

This post explains how to get these to play back in sync so I can combine audio events and MIDI events in a performance or piece.

## How to sync audio and MIDI

Web Audio events are [scheduled relative to when the AudioContext started](https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode/start), in seconds.

Web MIDI events are [scheduled relative to when the page started loading](https://webaudio.github.io/web-midi-api/#dom-midioutput-send), in milliseconds.

So we have two differences to account for:

- Seconds vs. milliseconds - e.g. x 1000
- When the page started loading vs when the AudioContext started

This second item is the tricky one - the AudioContext doesn't necessarily start when the page loads, could be much later.

We can measure this difference by using the [high resolution time API](https://developer.mozilla.org/en-US/docs/Web/API/Window/performance), and comparing that to the current AudioContext time.

```js
const perfNow = window.performance.now()
const audioNow = audioContext.currentTime;
const audioContextOffsetSec = ( perfNow / 1000.0 ) - audioNow;
```

This tells us how *late* audio events are relative to MIDI or real time. (MIDI events are sent in close to real time.)

So to sync we need to offset (delay) MIDI events by this latency:

```js
const timestamp = ( startSeconds * 1000 );
const offset = ( audioContextOffsetSec * 1000 );
midiOutPorts[0].send(
  [ 0x90 + 0, midiNote, 100 ],
  timestamp + offset
);
```


*For a long time I had this backwards – I'd schedule my audio events earlier by audioContextOffsetSec, trying to account for the latency, but this breaks down when you are scheduling close to now. The AudioContext can only schedule so far in advance.*

I've put up a complete [example on GitHub as a demo](https://github.com/haszari/sync-web-audio-web-midi) - take a look.

For a deeper dive on how to build a reliable, accurate sequencer in Web Audio and JavaScript, check out [A Tale of Two Clocks](https://www.html5rocks.com/en/tutorials/audio/scheduling/) on **HTML5 Rocks**. Spoiler alert: there are more than two clocks.

Hopefully this article helps someone - it took me a while to get my head around this. Although the Web MIDI API is still experimental, I'm really excited to see what apps and tools will emerge in its wake.

🚤   💻   🎛