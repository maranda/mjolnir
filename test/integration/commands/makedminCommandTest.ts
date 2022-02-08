import { strict as assert } from "assert";

import config from "../../../src/config";
import { newTestUser } from "../clientHelper";
import { PowerLevelAction } from "matrix-bot-sdk/lib/models/PowerLevelAction";
import { LogService } from "matrix-bot-sdk";
import { getFirstReaction } from "./commandUtils";

describe("Test: The make admin command", function () {
    it('Mjölnir make the bot self room administrator', async function () {
        this.timeout(120000);
        const mjolnir = config.RUNTIME.client!
        let mjolnirUserId = await mjolnir.getUserId();
        let moderator = await newTestUser({ name: { contains: "moderator" } });
        this.moderator = moderator;

        await moderator.joinRoom(config.managementRoom);
        LogService.debug("makeadminTest", `Joining managementRoom: ${config.managementRoom}`);
        let targetRoom = await moderator.createRoom({ invite: [mjolnirUserId] });
        LogService.debug("makeadminTest", `moderator creating targetRoom: ${targetRoom}; and inviting mjolnir and tester`);
        await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text.', body: `!mjolnir rooms add ${targetRoom}` });
        LogService.debug("makeadminTest", `Adding targetRoom: ${targetRoom}`);
        try {
            await moderator.start();
            await getFirstReaction(moderator, this.mjolnir.managementRoomId, '✅', async () => {
                return await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text', body: `!mjolnir make admin ${targetRoom}` });
            });
        } finally {
            moderator.stop();
        }
        LogService.debug("makeadminTest", `Making self admin`);

        assert.ok(await mjolnir.userHasPowerLevelForAction(mjolnirUserId, targetRoom, PowerLevelAction.Ban), "Bot user is now room admin.");
    });
    it('Mjölnir make the tester room administrator', async function () {
        this.timeout(120000);
        let moderator = await newTestUser({ name: { contains: "moderator" } });
        let tester = await newTestUser({ name: { contains: "tester" } });
        let testerUserId = await tester.getUserId();
        this.moderator = moderator;
        this.tester = tester;

        await moderator.joinRoom(config.managementRoom);
        LogService.debug("makeadminTest", `Joining managementRoom: ${config.managementRoom}`);
        let targetRoom = await moderator.createRoom({ invite: [testerUserId] });
        LogService.debug("makeadminTest", `moderator creating targetRoom: ${targetRoom}; and inviting tester`);
        await tester.joinRoom(targetRoom);
        LogService.debug("makeadminTest", `tester joining targetRoom: ${targetRoom}`);
        try {
            await moderator.start();
            await getFirstReaction(moderator, this.mjolnir.managementRoomId, '✅', async () => {
                return await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text.', body: `!mjolnir make admin ${targetRoom} ${testerUserId}` });
            });
        } finally {
            moderator.stop();
        }
        LogService.debug("makeadminTest", `Making tester admin`);

        assert.ok(await tester.userHasPowerLevelForAction(testerUserId, targetRoom, PowerLevelAction.Ban), "Tester user is now room admin.");
    });
});
