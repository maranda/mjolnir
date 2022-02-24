/*
Copyright 2020 Marco Cirillo

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Mjolnir } from "../Mjolnir";
import { extractRequestError, LogLevel, RichReply } from "matrix-bot-sdk";
import config from "../config";

// !mjolnir mass kick <pattern> [room] [reason]
export async function execMassKickCommand(roomId: string, event: any, mjolnir: Mjolnir, parts: string[]) {
    const pattern = new RegExp(parts[3]);

    let rooms = [...Object.keys(mjolnir.protectedRooms)];
    let reason;
    if (parts.length > 4) {
        let reasonIndex = 4;
        if (parts[4].startsWith("#") || parts[4].startsWith("!")) {
            rooms = [await mjolnir.client.resolveRoom(parts[4])];
            reasonIndex = 5;
        }
        reason = parts.slice(reasonIndex).join(' ') || '<no reason supplied>';
    }
    if (!reason) reason = "<none supplied>";

    for (const targetRoomId of rooms) {
        const joinedUsers = await mjolnir.client.getJoinedRoomMembers(targetRoomId);
        const filteredUsers = joinedUsers.filter(matrixId => matrixId.match(pattern));

        for (const user of filteredUsers) {
            if (!config.noop) {
                await mjolnir.logMessage(LogLevel.INFO, "MassKickCommand", `Kicking ${user} in ${targetRoomId} for ${reason}`);
                try {
                    await mjolnir.client.kickUser(user, targetRoomId, reason);
                } catch (e) {
                    const error = extractRequestError(e);
                    await logMessage(LogLevel.WARN, "MassKickCommand", `Failed to kick ${user} in ${targetRoomId}: ${error}`);
                    const text = `Failed to kick ${user}: ${error}`;
                    const reply = RichReply.createFor(roomId, event, text, text);
                    reply["msgtype"] = "m.notice";
                    await mjolnir.client.sendMessage(roomId, reply);
                }
            } else {
                await mjolnir.logMessage(LogLevel.WARN, "MassKickCommand", `Tried to kick ${user} in ${targetRoomId} but the bot is running in no-op mode.`);
            }
        }
    }

    await mjolnir.client.unstableApis.addReactionToEvent(roomId, event['event_id'], '✅');
}
