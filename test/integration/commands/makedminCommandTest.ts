import { strict as assert } from "assert";

import config from "../../../src/config";
import { newTestUser } from "../clientHelper";
import { PowerLevelAction } from "matrix-bot-sdk/lib/models/PowerLevelAction";
import { LogService } from "matrix-bot-sdk";
import { getFirstReaction } from "./commandUtils";

describe("Test: The make admin command", function () {
    this.beforeEach(async function () {
        this.timeout(1000);
        const mjolnir = config.RUNTIME.client!;
    });
    this.afterEach(async function () {
        this.timeout(1000);
        const mjolnir = config.RUNTIME.client!;
    });

    it('Mjölnir make the bot self room administrator', async function () {
        this.timeout(60000);
        const mjolnir = config.RUNTIME.client!;
        const mjolnirUserId = await mjolnir.getUserId();
        const moderator = await newTestUser({ name: { contains: "moderator" } });

        await moderator.joinRoom(config.managementRoom);
        LogService.debug("makeadminTest", `Joining managementRoom: ${config.managementRoom}`);
        let targetRoom = await moderator.createRoom({ invite: [mjolnirUserId] });
        LogService.debug("makeadminTest", `moderator creating targetRoom: ${targetRoom}; and inviting mjolnir`);
        await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text.', body: `!mjolnir rooms add ${targetRoom}` });
        LogService.debug("makeadminTest", `Adding targetRoom: ${targetRoom}`);
        try {
            await moderator.start();
            await getFirstReaction(mjolnir, this.mjolnir.managementRoomId, '✅', async () => {
                return await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text', body: `!mjolnir make admin ${targetRoom}` });
            });
        } finally {
            await moderator.stop();
        }
        LogService.debug("makeadminTest", `Making self admin`);

        assert.ok(await mjolnir.userHasPowerLevelForAction(mjolnirUserId, targetRoom, PowerLevelAction.Ban), "Bot user is now room admin.");
    });
    it('Mjölnir make the tester room administrator', async function () {
        this.timeout(60000);
        const mjolnir = config.RUNTIME.client!;
        const moderator = await newTestUser({ name: { contains: "moderator" } });
        const testUser = await newTestUser({ name: { contains: "tester" } });
        const testUserId = await testUser.getUserId();

        await moderator.joinRoom(config.managementRoom);
        LogService.debug("makeadminTest", `Joining managementRoom: ${config.managementRoom}`);
        let targetRoom = await moderator.createRoom({ invite: [testUserId] });
        LogService.debug("makeadminTest", `moderator creating targetRoom: ${targetRoom}; and inviting ${testUserId}`);
        await testUser.joinRoom(targetRoom);
        LogService.debug("makeadminTest", `tester joining targetRoom: ${targetRoom}`);
        try {
            await moderator.start();
            await getFirstReaction(mjolnir, this.mjolnir.managementRoomId, '✅', async () => {
                return await moderator.sendMessage(this.mjolnir.managementRoomId, { msgtype: 'm.text.', body: `!mjolnir make admin ${targetRoom} ${testUserId}` });
            });
        } finally {
            await moderator.stop();
        }
        LogService.debug("makeadminTest", `Making tester admin`);

        assert.ok(await testUser.userHasPowerLevelForAction(testUserId, targetRoom, PowerLevelAction.Ban), "Tester user is now room admin.");
    });
});
