class HotsReplayInit {

    /**
     * @param {HotsReplay} replay
     * @param {MpqBuffer} buffer
     */
    constructor(replay, buffer) {
        this.replay = replay;
        this.playerNames = {};
        this.readFromMpqBuffer(buffer);
    }

    /**
     * @param {MpqBuffer} buffer
     */
    readFromMpqBuffer(buffer) {
        let playerListLength = buffer.readUInt(5);
        for (let i = 0; i < playerListLength; i++) {
            let playerName = buffer.readBlockPrecededWithLength(8);
            if (playerName !== "") {
                this.playerNames[i] = playerName;
            }
            // Clan tag
            if (buffer.readBoolean()) {
                buffer.readBlockPrecededWithLength(8);
            }
            // Clan logo
            if (buffer.readBoolean()) {
                buffer.readBlockPrecededWithLength(40);
            }
            // Highest league
            if (buffer.readBoolean()) {
                buffer.readUInt8();
            }
            // Combined race levels
            if (buffer.readBoolean()) {
                buffer.readUInt32();
            }
            // Random seed (So far, always 0 in Heroes)
            buffer.readUInt32();
            // Race preference
            if (buffer.readBoolean()) {
                buffer.readUInt8();
            }
            // Team preference
            if (buffer.readBoolean()) {
                buffer.readUInt8();
            }
            // Test map
            buffer.readBoolean();
            // Test auto
            buffer.readBoolean();
            // Examine
            buffer.readBoolean();
            // Custom interface
            buffer.readBoolean();
            // m_testType
            buffer.readUInt32();
            // Observer
            buffer.readUInt(2);
            // m_hero - Currently Empty String
            buffer.readBlockPrecededWithLength(9);
            // m_skin - Currently Empty String
            buffer.readBlockPrecededWithLength(9);
            // m_mount - Currently Empty String
            buffer.readBlockPrecededWithLength(9);
            if (this.replay.header.versionMajor >= 2) {
                // m_banner - Currently Empty String
                buffer.readBlockPrecededWithLength(9);
                // m_spray - Currently Empty String
                buffer.readBlockPrecededWithLength(9);
            }
            // m_toonHandle - Currently Empty String
            buffer.readBlockPrecededWithLength(7);
        }
        buffer.alignToByte();
        // Marked as 'Random Value', so I will use as seed
        this.randomValue = buffer.readInt(30);
        // m_gameCacheName - "Dflt"
        buffer.readBlockPrecededWithLength(10);
        buffer.readBoolean(); // Lock Teams
        buffer.readBoolean(); // Teams Together
        buffer.readBoolean(); // Advanced Shared Control
        buffer.readBoolean(); // Random Races
        buffer.readBoolean(); // BattleNet
        buffer.readBoolean(); // AMM
        buffer.readBoolean(); // Competitive
        buffer.readBoolean(); // m_practice
        buffer.readBoolean(); // m_cooperative
        buffer.readBoolean(); // m_noVictoryOrDefeat
        buffer.readBoolean(); // m_heroDuplicatesAllowed
        buffer.readUInt(2); // Fog
        buffer.readUInt(2); // Observers
        buffer.readUInt(2); // User Difficulty
        buffer.readInt64(); // 64 bit int: Client Debug Flags
        // m_ammId
        if (this.replay.header.versionBuild >= 43905 && buffer.readBoolean()) {
            switch (buffer.readInt32()) {
                case 50021:
                    this.replay.GameMode = "VersusAi";
                    break;
                case 50041:
                    this.replay.GameMode = "Practice";
                    break;
                case 50001:
                    this.replay.GameMode = "QuickMatch";
                    break;
                case 50031:
                    this.replay.GameMode = "Brawl";
                    break;
                case 50051:
                    this.replay.GameMode = "UnrankedDraft";
                    break;
                case 50061:
                    this.replay.GameMode = "HeroLeague";
                    break;
                case 50071:
                    this.replay.GameMode = "TeamLeague";
                    break;
                case 50091:
                    this.replay.GameMode = "StormLeague";
                    break;
                default:
                    this.replay.GameMode = "Unknown";
                    break;
            }
        }
        // Game Speed
        buffer.readUInt(3);
        // Game Type - Not sure what this 'Game Type' is
        buffer.readUInt(3);

        // Max Players
        let maxUsers = buffer.readUInt(5);
        if ((maxUsers != 10) && (this.replay.GameMode !== "Brawl")) {
            this.replay.GameMode = "TryMe";
        }
    }

}

module.exports = HotsReplayInit;
