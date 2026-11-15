# Standard manual test

Run this in the studio before finishing any change to loading a post, generating ideas, or writing the reel and carousels. Record each row as pass or fail against the pass condition. Do not treat a known gap as a pass.

## Steps

For each source:

1. Paste the link into Post URL and click Load link. For the video transcript, skip the link and paste the text instead.
2. Read Copied Post Content.
3. If a real post is in the box, click Generate Repurpose Ideas.
4. Open two different angles and compare the first spoken line of each reel.

## Cases

| Source | Input | Pass when |
| --- | --- | --- |
| X | `https://x.com/jack/status/1833951636005552366` | The box contains `We reject: kings, presidents, and voting.` and the post stays in English. The key insight is a line from that post. The first hook quotes `We reject: kings, presidents, and voting.` The second angle's opening line is different. |
| LinkedIn | `https://www.linkedin.com/feed/update/urn:li:activity:7496582593438523392` | The box keeps more than the opening line, including `campaign brief checklist` and the following paragraph. The key insight is from that post. The first hook quotes the opening. The second angle's opening line is different. |
| Instagram | `https://www.instagram.com/p/C8QJv0sR0eY/` | Load link puts the post caption in the box. A login wall, an empty box, or the previous post left in place is a fail. |
| Threads | `https://www.threads.net/@mosseri` | Load link puts one thread post in the box. A follower count, a bio, or a login prompt is a fail. |
| Video transcript | Set the source to Transcript and paste: `[00:00:01] The offer was weak, so more ads could not save it.` and `[00:00:04] Rewriting the first line made the same budget convert.` Also try `https://www.youtube.com/watch?v=jNQXAC9IVRw` with Load link. | Ideas quote `The offer was weak, so more ads could not save it.` and do not include `[00:00:01]`. The key insight is `Rewriting the first line made the same budget convert.` The two angle openings differ. No reel beat still contains `[00:00:01]` or `[00:00:04]`. A YouTube link passes only when the box receives the spoken transcript. |

## Last run

16 November 2026, about 12:00 AM Hong Kong time.

| Source | Load | Ideas | Two angles |
| --- | --- | --- | --- |
| X | Pass. `We reject: kings, presidents, and voting.` English. | Pass. Key insight: `We believe in: rough consensus and running code.` First hook quotes `We reject: kings, presidents, and voting.` | Pass. Second opening: `Steal this exact playbook we used to turn insight into results.` |
| LinkedIn | Pass. Full post, starting `Community Resource Friday: the campaign brief checklist...` | Pass. Key insight: `A strong brief does more than describe the deliverable. It gives the team a shared definition of the problem, the audience, and the win.` | Pass. Second opening is the playbook hook. |
| Instagram | Fail. `No post text was found on that page. Paste the caption into the box.` The previous text stayed in the box. | Not run. | Not run. |
| Threads | Fail. The box got `1.1M Followers • 448 Threads • Father of three boys...`, not a thread. | Not run. | Not run. |
| Video transcript | Paste is in the box with the timestamps. The YouTube link did not return a transcript. | Pass. Key insight: `Rewriting the first line made the same budget convert.` First hook quotes the spoken sentence and has no `[00:00:01]`. | Openings differ. Fail on the next beat: both angles say `Here is why most people get this wrong: [00:00:01] The offer was weak, so more ads could not save it.` |

Replace this last-run table after every execution. Keep the pass conditions above unchanged unless the product requirement changes.
