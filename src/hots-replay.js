// Local classes
const MpqFile = require('mpq-file').MpqFile;
const MpqBuffer = require('mpq-file').MpqBuffer;
const HotsDecoder = require('./hots-decoder.js');

class HotsReplay extends MpqFile {

    static get Decoder() {
        return HotsDecoder;
    }

    static get Buffer() {
        return MpqBuffer;
    }

    constructor(file) {
        super(file);
        this.bufferMpq = new MpqBuffer(this.buffer, 16);
        this.replayHeader = HotsDecoder.decode_versioned(this.bufferMpq, "replay_header_typeid");
        this.replayDetails = null;
        this.replayDataInit = null;
        this.replayBattleLobby = null;
        this.replayGameEvents = null;
        this.replayMessageEvents = null;
        this.replayTrackerEvents = null;
        this.replayAttributesEvents = null;
    }

    getReplayDetails() {
        if (this.replayDetails === null) {
            this.replayDetails = HotsDecoder.decode_versioned(this.openFile("replay.details").readFile(), "game_details_typeid");
        }
        return this.replayDetails;
    }

    getReplayDataInit() {
        if (this.replayDataInit === null) {
            this.replayDataInit = HotsDecoder.decode_bitPacked(this.openFile("replay.initData").readFile(), "replay_initdata_typeid");
        }
        return this.replayDataInit;
    }

    getReplayBattleLobby() {
        if (this.replayBattleLobby === null) {
            let battlelobby = this.openFile("replay.server.battlelobby").readFile();
            let replayDetails = this.getReplayDetails();
            this.replayBattleLobby = {
                battleTags: []
            };
            try {
                for (let i = 0; i < replayDetails.m_playerList.length; i++) {
                    battlelobby.seekToString(replayDetails.m_playerList[i].m_name);
                    this.replayBattleLobby.battleTags.push({
                        playerIndex: i,
                        playerName: replayDetails.m_playerList[i].m_name,
                        tag: battlelobby.readString()
                    });
                }
            } catch (error) {
                // Failed to read all battle tags
                console.error("Failed to read all battle tags!")
                console.error(error);
            }
        }
        return this.replayBattleLobby;
    }

    getReplayGameEvents() {
        if (this.replayGameEvents === null) {
            throw new Error("Not yet implemented!");
            //this.replayGameEvents = HotsDecoder.decode_bitPacked(this.openFile("replay.game.events").readFile(), "replay_initdata_typeid");
        }
        return this.replayGameEvents;
    }

    getReplayMessageEvents() {
        if (this.replayMessageEvents === null) {
            throw new Error("Not yet implemented!");
            //this.replayMessageEvents = HotsDecoder.decode_bitPacked(this.openFile("replay.game.events").readFile(), "replay_initdata_typeid");
        }
        return this.replayMessageEvents;
    }

    getReplayTrackerEvents() {
        if (this.replayTrackerEvents === null) {
            this.replayTrackerEvents = HotsDecoder.decode_event_stream(
              this.openFile("replay.tracker.events").readFile(),
              "tracker_eventid_typeid", "tracker_event_types", false
            );
        }
        return this.replayTrackerEvents;
    }

    getReplayAttributesEvents() {
        if (this.replayAttributesEvents === null) {
            throw new Error("Not yet implemented!");
            //this.replayAttributesEvents = HotsDecoder.decode_bitPacked(this.openFile("replay.initData").readFile(), "replay_initdata_typeid");
        }
        return this.replayAttributesEvents;
    }

}

module.exports = HotsReplay;
