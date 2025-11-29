import { ActionPanel, List, Action, getPreferenceValues, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";

interface Preferences {
    julesApiKey: string;
}

type Source = {
    name: string;
    id: string;
    githubRepo: {
        owner: string;
        repo: string;
    };
};

type SourcesResponse = {
    sources: Source[];
    nextPageToken?: string;
};

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

export default function Command() {
    const preferences = getPreferenceValues<Preferences>();
    const [selectedSource, setSelectedSource] = useState<string>("");

    const { data: sourcesData, isLoading: isLoadingSources } = useFetch<SourcesResponse>(
        "https://jules.googleapis.com/v1alpha/sources",
        {
            headers: {
                "X-Goog-Api-Key": preferences.julesApiKey,
            },
            onError: (error) => {
                showToast({
                    style: Toast.Style.Failure,
                    title: "Failed to fetch sources",
                    message: error.message,
                });
            },
        }
    );

    const { data: sessionsData, isLoading: isLoadingSessions } = useFetch<SessionsResponse>(
        "https://jules.googleapis.com/v1alpha/sessions",
        {
            headers: {
                "X-Goog-Api-Key": preferences.julesApiKey,
            },
            onError: (error) => {
                showToast({
                    style: Toast.Style.Failure,
                    title: "Failed to fetch sessions",
                    message: error.message,
                });
            },
        }
    );

    useEffect(() => {
        if (sourcesData?.sources && sourcesData.sources.length > 0 && !selectedSource) {
            setSelectedSource(sourcesData.sources[0].name);
        }
    }, [sourcesData]);

    const filteredSessions = sessionsData?.sessions?.filter(
        (session) => session.sourceContext?.source === selectedSource
    ) || [];

    return (
        <List
            isLoading={isLoadingSources || isLoadingSessions}
            searchBarAccessory={
                <List.Dropdown
                    tooltip="Select Source"
                    value={selectedSource}
                    onChange={setSelectedSource}
                >
                    {sourcesData?.sources?.map((source) => (
                        <List.Dropdown.Item
                            key={source.name}
                            value={source.name}
                            title={`${source.githubRepo.owner}/${source.githubRepo.repo}`}
                        />
                    ))}
                </List.Dropdown>
            }
        >
            {filteredSessions.map((session) => (
                <List.Item
                    key={session.id}
                    title={session.title || session.prompt || "Untitled Session"}
                    subtitle={session.state}
                    accessories={[
                        { text: session.id },
                    ]}
                    actions={
                        <ActionPanel>
                            {session.url && <Action.OpenInBrowser url={session.url} />}
                            <Action.CopyToClipboard content={session.id} title="Copy Session ID" />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}
