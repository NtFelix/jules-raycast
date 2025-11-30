import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";

export const API_BASE_URL = "https://jules.googleapis.com/v1alpha";

export interface Preferences {
  julesApiKey: string;
}

export type GitHubBranch = {
  displayName: string;
};

export type GitHubRepo = {
  owner: string;
  repo: string;
  defaultBranch?: GitHubBranch;
  branches?: GitHubBranch[];
};

export type Source = {
  name: string;
  id: string;
  githubRepo: GitHubRepo;
};

export type SourcesResponse = {
  sources: Source[];
  nextPageToken?: string;
};

export function useSources() {
  const preferences = getPreferenceValues<Preferences>();

  return useFetch<SourcesResponse>(`${API_BASE_URL}/sources`, {
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
  });
}
