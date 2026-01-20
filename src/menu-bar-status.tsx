import {
    MenuBarExtra,
    getPreferenceValues,
    Icon,
    open,
    launchCommand,
    LaunchType,
    Color,
} from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useMemo } from "react";
import { Preferences, API_BASE_URL, API_KEY_ERROR_MESSAGE } from "./api";

type Session = {
    name: string;
    id: string;
    title: string;
    state: string;
    url: string;
    prompt: string;
    sourceContext: {
        source: string;
    };
};

type SessionsResponse = {
    sessions: Session[];
    nextPageToken?: string;
};

const stateColorMap: Record<string, Color> = {
    succeeded: Color.Green,
    completed: Color.Green,
    failed: Color.Red,
    error: Color.Red,
    in_progress: Color.Blue,
    running: Color.Blue,
    active: Color.Blue,
    awaiting_user_feedback: Color.Orange,
    pending: Color.Yellow,
};

function truncate(text: string, length = 40) {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
}

function getStateIcon(state?: string) {
    const s = (state || "").toLowerCase();
    if (s === "running" || s === "in_progress" || s === "active" || s === "awaiting_user_feedback") {
        return { source: Icon.Circle, tintColor: Color.Orange };
    }
    if (s === "succeeded" || s === "completed" || s === "done") {
        return { source: Icon.Checkmark, tintColor: Color.Green };
    }
    if (s === "failed" || s === "error") {
        return { source: Icon.XMarkCircle, tintColor: Color.Red };
    }
    // Default/Pending/Planned
    return { source: Icon.Circle, tintColor: Color.SecondaryText };
}

export default function MenuBarStatus() {
    const preferences = getPreferenceValues<Preferences>();

    const { data, isLoading } = useFetch<SessionsResponse>(`${API_BASE_URL}/sessions`, {
        headers: {
            "X-Goog-Api-Key": preferences.julesApiKey,
        },
    });

    const recentSessions = useMemo(() => {
        return (data?.sessions || []).slice(0, 5);
    }, [data]);

    return (
        <MenuBarExtra icon="extension-icon.png" isLoading={isLoading} tooltip="Jules Session Status">
            <MenuBarExtra.Section title="Recent Sessions">
                {recentSessions.map((session) => (
                    <MenuBarExtra.Item
                        key={session.id}
                        title={truncate(session.title || session.prompt || "Untitled Session")}
                        subtitle={session.state}
                        icon={getStateIcon(session.state)}
                        onAction={() => session.url && open(session.url)}
                    />
                ))}
                {recentSessions.length === 0 && !isLoading && <MenuBarExtra.Item title="No recent sessions" />}
            </MenuBarExtra.Section>

            <MenuBarExtra.Section>
                <MenuBarExtra.Item
                    title="Start New Session"
                    icon={Icon.Plus}
                    onAction={() => launchCommand({ name: "start-new-session", type: LaunchType.UserInitiated })}
                />
                <MenuBarExtra.Item
                    title="Search Sessions"
                    icon={Icon.MagnifyingGlass}
                    onAction={() => launchCommand({ name: "list-sessions", type: LaunchType.UserInitiated })}
                />
            </MenuBarExtra.Section>
        </MenuBarExtra>
    );
}
