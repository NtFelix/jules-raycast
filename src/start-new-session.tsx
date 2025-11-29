import { Form, ActionPanel, Action, showToast, getPreferenceValues, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";

interface Preferences {
  julesApiKey: string;
}

type GitHubBranch = {
  displayName: string;
};

type GitHubRepo = {
  owner: string;
  repo: string;
  defaultBranch?: GitHubBranch;
  branches?: GitHubBranch[];
};

type Source = {
  name: string;
  id: string;
  githubRepo: GitHubRepo;
};

type SourcesResponse = {
  sources: Source[];
  nextPageToken?: string;
};

type FormValues = {
  source: string;
  branch: string;
  message: string;
};

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [isLoading, setIsLoading] = useState(false);
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
    },
  );

  const { data: sourceDetails, isLoading: isLoadingSourceDetails } = useFetch<Source>(
    `https://jules.googleapis.com/v1alpha/${selectedSource}`,
    {
      headers: {
        "X-Goog-Api-Key": preferences.julesApiKey,
      },
      execute: !!selectedSource,
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch source details",
          message: error.message,
        });
      },
    },
  );

  // Set initial selected source when sources are loaded
  useEffect(() => {
    if (sourcesData?.sources && sourcesData.sources.length > 0 && !selectedSource) {
      setSelectedSource(sourcesData.sources[0].name);
    }
  }, [sourcesData]);

  async function handleSubmit(values: FormValues) {
    setIsLoading(true);
    const toast = await showToast({ style: Toast.Style.Animated, title: "Creating session..." });

    try {
      const response = await fetch("https://jules.googleapis.com/v1alpha/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": preferences.julesApiKey,
        },
        body: JSON.stringify({
          prompt: values.message,
          sourceContext: {
            source: values.source,
            githubRepoContext: {
              startingBranch: values.branch,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create session: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Session created:", result);

      toast.style = Toast.Style.Success;
      toast.title = "Session created successfully";
      toast.message = "Check logs for details";
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to create session";
      toast.message = error instanceof Error ? error.message : String(error);
    } finally {
      setIsLoading(false);
    }
  }

  const branches = sourceDetails?.githubRepo?.branches || [];
  const defaultBranch = sourceDetails?.githubRepo?.defaultBranch?.displayName;

  return (
    <Form
      isLoading={isLoading || isLoadingSources || isLoadingSourceDetails}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="source" title="Source" value={selectedSource} onChange={setSelectedSource}>
        {sourcesData?.sources?.map((source) => (
          <Form.Dropdown.Item
            key={source.name}
            value={source.name}
            title={`${source.githubRepo.owner}/${source.githubRepo.repo}`}
          />
        ))}
      </Form.Dropdown>

      <Form.Dropdown id="branch" title="Branch" defaultValue={defaultBranch}>
        {branches.map((branch) => (
          <Form.Dropdown.Item key={branch.displayName} value={branch.displayName} title={branch.displayName} />
        ))}
      </Form.Dropdown>

      <Form.TextArea id="message" title="Message" placeholder="Enter your chat message..." />
    </Form>
  );
}
