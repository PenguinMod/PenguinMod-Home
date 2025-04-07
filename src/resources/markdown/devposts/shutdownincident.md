# Server Shutdown Incident (1/21/2025)
On January 21st of 2025, we lost access to our own servers potentially deleting over 3 thousand projects and 10 thousand accounts.

This post is meant to explain what happened before we lost access, what actually happened, what we did wrong, and what our third-party server provider did.

PenguinMod Projects that you have saved to your computer were not directly affected by this outage.
Restore points in the PenguinMod editor were also not affected.

## Our setup
*Technical detail:*
Our project servers are written in [Node.js](https://nodejs.org/), holding account and project info in a [MongoDB](https://www.mongodb.com/) database and project data in [MinIO](https://min.io/) buckets.
This gave us a stable setup for the servers that we could maintain for a long time.

*Technical detail:*
The project servers at this time were hosted on [Oracle](https://www.oracle.com/), using a free-tier Oracle account.

## What (likely) caused the outage?
On January 18th, we were attempting to setup and put project assets (costumes, sounds, etc) onto [Backblaze](https://www.backblaze.com/) since we were reaching limits on our server's storage.

This process did complete and on the 20th, assets for PenguinMod projects were on Backblaze.
However, the process did strain a lot of the server's CPU (the server was very slow), and used a lot of network bandwidth.

*Technical detail:*
It also turned out that the majority of the server's space (over 60 gigabytes) was not actually used by PenguinMod projects, but by Docker logs of what the server was doing.

## Server Outage
The next day, January 21st, we could no longer connect to the PenguinMod projects server.

Ianyourgod (PenguinMod server developer) could not connect to the live PenguinMod server, could not login to our Oracle account, and the PenguinMod server refused connections from any source.

*Technical detail:*
We also could not SSH into the server directly anymore. The connections would be refused.

Our belief is that due to our free-tier Oracle account, we were not supposed to be sending large amounts of data to our Backblaze storage at the speed we were doing it at.

*Technical detail:*
The traffic was around 32 gigabytes of data.

## Contacting Oracle support
**This section is only for transparency on what we tried, and not for harrassment.** Do not contact Oracle for anything related to PenguinMod.

Due to the use of the free-tier Oracle servers, we didn't have any direct contact or priority with Oracle.

We sent multiple emails they responded to only once, asking our use-case and nothing more. Our follow-up was not seen.

We also did not manage to get any of our calls answered, they simply hung up after a short hold time.

## Our Responsibility
PenguinMod is not liable for any loss of data, but we still should have setup backups for your accounts & projects before anything like this could have happened.
We also now understand that hosting a large project like this one should not have been done on a free service.

Since this incident, we have moved from using free-tier accounts and are now spending money on a Virtual Private Server.
*Thank you to everyone who has donated so far! :D*

We can't guarantee nothing will be lost like this again, but we have setup everything to where it should be impossible.

Thank you for reading this page. We will support our new servers and your projects as best as we can from now on.
