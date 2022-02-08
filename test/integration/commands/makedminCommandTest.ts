import { strict as assert } from "assert";

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
        await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text', body: `!mjolnir make admin ${targetRoom}` });
        LogService.debug("makeadminTest", `Making self admin`);
        await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text.', body: `!mjolnir make admin ${targetRoom} ${testerUserId}` });
        LogService.debug("makeadminTest", `Making tester admin`);

        let botIsAdmin = await mjolnir.userHasPowerLevelForAction(mjolnirUserId, targetRoom, PowerLevelAction.Ban);
        let testerIsAdmin = await mjolnir.userHasPowerLevelForAction(testerUserId, targetRoom, PowerLevelAction.Ban);

        assert.ok(botIsAdmin, true, "Bot user is now room admin.");
        assert.ok(testerIsAdmin, true, "Tester user is now room admin.");
    });
});
