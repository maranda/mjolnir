﻿import { strict as assert } from "assert";

import config from "../../../src/config";
import { newTestUser } from "../clientHelper";
import { PowerLevelAction } from "matrix-bot-sdk/lib/models/PowerLevelAction";
import { LogService } from "matrix-bot-sdk";
import { getFirstReaction } from "./commandUtils";

describe("Test: The make admin command", function () {
    // If a test has a timeout while awaitng on a promise then we never get given control back.
    afterEach(function () { this.moderator ?.stop(); });

    it('Mjölnir make the bot self room administrator and some other tester too', async function () {
        this.timeout(120000);
        const mjolnir = config.RUNTIME.client!
        let mjolnirUserId = await mjolnir.getUserId();
        let moderator = await newTestUser({ name: { contains: "moderator" } });
        let tester = await newTestUser({ name: { contains: "tester" } });
        let testerUserId = await tester.getUserId();
        this.moderator = moderator;
        this.tester = tester;

        await moderator.joinRoom(config.managementRoom);
        LogService.debug("makeadminTest", `Joining managementRoom: ${config.managementRoom}`);
        let targetRoom = await moderator.createRoom({ invite: [mjolnirUserId, testerUserId] });
        LogService.debug("makeadminTest", `moderator creating targetRoom: ${targetRoom}; and inviting mjolnir and tester`);
        await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text.', body: `!mjolnir rooms add ${targetRoom}` });
        LogService.debug("makeadminTest", `Adding targetRoom: ${targetRoom}`);
        await tester.joinRoom(targetRoom);
        LogService.debug("makeadminTest", `tester joining targetRoom: ${targetRoom}`);
        try {
            await moderator.start();
            await getFirstReaction(moderator, this.mjolnir.managementRoomId, "\u2705", async () => {
                return await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text', body: `!mjolnir make admin ${targetRoom}` });
            });
        } finally {
            moderator.stop();
        }
        LogService.debug("makeadminTest", `Making self admin`);
        try {
            await moderator.start();
            await getFirstReaction(moderator, this.mjolnir.managementRoomId, "\u2705", async () => {
                return await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text.', body: `!mjolnir make admin ${targetRoom} ${testerUserId}` });
            });
        } finally {
            moderator.stop();
        }
        LogService.debug("makeadminTest", `Making tester admin`);

        assert.ok(await mjolnir.userHasPowerLevelForAction(mjolnirUserId, targetRoom, PowerLevelAction.Ban), "Bot user is now room admin.");
        assert.ok(await mjolnir.userHasPowerLevelForAction(testerUserId, targetRoom, PowerLevelAction.Ban), "Tester user is now room admin.");
    });
});
