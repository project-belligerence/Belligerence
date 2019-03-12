<p align="center">
  <a href="https://github.com/Neefay/Belligerence">
   <img src="https://belligerence-test-1.s3.us-east-2.amazonaws.com/data/logo2.png" alt="Belligerence">
  </a>
   <br/><br/>
  <a href="https://github.com/Neefay/Belligerence/commits/master">
    <img src="https://img.shields.io/github/package-json/v/Neefay/Belligerence.svg" alt="Current version">
  </a>
  <a href="https://github.com/Neefay/Belligerence/issues">
    <img src="https://img.shields.io/github/issues/Neefay/Belligerence.svg" alt="Issues">
  </a>
  <img src="https://img.shields.io/github/license/Neefay/Belligerence.svg">  
</p>
<p align="center">
  <a href="https://belligerence.online">🖥 Live Alpha</a>.
</p>

## ABOUT

**BELLIGERENCE** is an application that simulates an environment of perpetual war together with an automated supply/demand economy, integrated with ArmA 3, by Bohemia Interactive.

Developed over the course of three and a half years by one person, the project aim to prototype a different vision for shooter games, adding both persistency and a deep sense of progression.

[📄 Read more about its history here](https://belligerence.online/about).

## BRIEF FEATURES LIST

### Social
* "**Cheers**" system, where most objects in the application can be "liked", including posts and comments. [📂 Cheers](https://github.com/Neefay/Belligerence/tree/master/modules/cheers)
* Users are able to leave **Comments** on posts, profiles, etc, being able to also sort them out by date or popularity. [📂 Comments](https://github.com/Neefay/Belligerence/tree/master/modules/comments)
* **Friends** system, where players and Outfits can set up alliances with one another. [📂 Friends](https://github.com/Neefay/Belligerence/tree/master/modules/friends)
* Players can post **Intel** with a wide range of customizations, such as anonymity, pictures, and etc. [📂 Intel](https://github.com/Neefay/Belligerence/tree/master/modules/intel)
* A robust system can handle **Invites** for all sorts of player interactions, from friend requests to Outfit applications. [📂 Invites](https://github.com/Neefay/Belligerence/tree/master/modules/Invites)
* Players can exchange **Messages** to one another, with real-time alerts for replies. [📂 Messages](https://github.com/Neefay/Belligerence/tree/master/modules/messages)

### War Engine
* **Conflicts** take place between **Factions** within **Maps**, simulating the usage of assets, casualties, supporting elements and even context-specific modifiers. [📂 Conflicts](https://github.com/Neefay/Belligerence/tree/master/modules/conflicts)
* **Factions** are the various groups and interests that will participate in **Conflicts** and post *Missions**. They have several stats and attributes, ranging from external policy, organization, munificence, asset capabilities, and a lot more. [📂 Factions](https://github.com/Neefay/Belligerence/tree/master/modules/Factions)
* **Locations** determine where Missions will take place, having many, many different parameters that affect the values of all events associated. [📂 Locations](https://github.com/Neefay/Belligerence/tree/master/modules/locations)
* **Maps** are the islands where the entire action will take place, every server hosting its own. [📂 Maps](https://github.com/Neefay/Belligerence/tree/master/modules/maps)
* **Missions** are where the real action happens, taking from several parameters in order to determine its final values. [📂 Missions](https://github.com/Neefay/Belligerence/tree/master/modules/missions)
* **Objectives** describe the kind of task which be assigned to a Mission, including chance of generation, maximum player-count, and others. [📂 Objectives](https://github.com/Neefay/Belligerence/tree/master/modules/objectives)

### Business
* Freelancers can mark Missions with an **Interest** token, marking their desired markup service. [📂 Interest](https://github.com/Neefay/Belligerence/tree/master/modules/interest)
* **Contracts** represent a unit's attachment to a **Mission** and the reward percentage established. [📂 Contracts](https://github.com/Neefay/Belligerence/tree/master/modules/contracts)
* While deciding on the values of a Contract, users are able to utilize the **Negotiation** system, allowing to counter-offer each other unil an agreement can be reached. [📂 Negotiations](https://github.com/Neefay/Belligerence/tree/master/modules/negotiations)

### Game Interaction
* **Items** are an essential part of the game, categorized very thoroughly. [📂 Items](https://github.com/Neefay/Belligerence/tree/master/modules/items)
* Players and Outfits can also save their favorite item combinations as **Loadouts**, which can also be shared and saved to be loaded at any point. [📂 Loadouts](https://github.com/Neefay/Belligerence/tree/master/modules/loadouts)
* **Stores** are highly configurable environments where Freelancers and Outfits can purchase items, just as long as they fit their criteria. [📂 Stores](https://github.com/Neefay/Belligerence/tree/master/modules/stores)
* Stores Items are determined by extremely customizable **Stock** options, where resupply days, variations in price and supply, all can be defined by content managers. [📂 Store Stock](https://github.com/Neefay/Belligerence/tree/master/modules/store_stock)
* Players can advance through the game by purchasing **Upgrades**, which not only function as a gate-keeping mechanism for features, but are also highly customizable and feature a self-generating tree. [📂 Upgrades](https://github.com/Neefay/Belligerence/tree/master/modules/upgrades)

### System
* **Permission/Voucher** redeeming system, allowing for the issuing of special keys that grant certain properties to its holder. [📂 Access Keys](https://github.com/Neefay/Belligerence/tree/master/modules/access_keys)
* A powerful **Uploading** system who can store images compressed and resized, alongside full **S3 Integration**, where all methods will utilize a bucket automatically once credentials are detected. [📂 Uploads](https://github.com/Neefay/Belligerence/tree/master/modules/uploads) [📂 AWS](https://github.com/Neefay/Belligerence/tree/master/modules/aws)
* **Ban/Reporting**, where content/players can be reported for various reasons and dealt accordingly. Banned players will be blocked only from certain areas of the app and administrators can also determine the length of said ban. [📂 Bans](https://github.com/Neefay/Belligerence/tree/master/modules/uploads) [📂 Reports](https://github.com/Neefay/Belligerence/tree/master/modules/uploads)
* **Players** can register for accounts, being then able to become either *Freelancers*, *Soldiers*, or *Commanders*, each with their unique role. [📂 Players](https://github.com/Neefay/Belligerence/tree/master/modules/players)
* **Outfits**, or PMCs (Private Military Company) are the organizations that drive the main force within the system, taking on Missions, hiring Freelancers, and getting things done. [📂 Outfits](https://github.com/Neefay/Belligerence/tree/master/modules/pmc)
* Configurable utilizing as few "magic numbers" as possible, with several configuration files. [📂 Configs](https://github.com/Neefay/Belligerence/tree/master/configs)
* Fully featured integration with WebSockets and the WebANotificationsAPI. [📂 WebSockets](https://github.com/Neefay/Belligerence/tree/master/configs/websocket.js)


Please however do keep in mind: this is barely scraping the surface of all of the UI features, inner-workings of the more complex algorithms, etc. I would need an entire team just in order to document this project in its full extent.

[Most of this info as a slideshow](https://docs.google.com/presentation/d/14h-Q_-ig93-mOFMJ6zKH9dUW2TLvml0L3TQ5CmcA8KE/edit?usp=sharing).

## BUILDING

Instructions soon. I'll need to cook up a .env template along with all of the other instructions and that's currently beyond my scope.
