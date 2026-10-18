export {};

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }

  namespace YT {
    enum PlayerState {
      UNSTARTED = -1,
      ENDED = 0,
      PLAYING = 1,
      PAUSED = 2,
      BUFFERING = 3,
      CUED = 5,
    }

    interface PlayerVars {
      autoplay?: 0 | 1;
      modestbranding?: 0 | 1;
      rel?: 0 | 1;
      playsinline?: 0 | 1;
      origin?: string;
      list?: string;
      listType?: "playlist" | "user_uploads";
    }

    interface PlayerOptions {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: PlayerVars;
      events?: {
        onReady?: (event: { target: Player }) => void;
        onError?: (event: { data: number; target: Player }) => void;
        onStateChange?: (event: { data: number; target: Player }) => void;
      };
    }

    interface VideoData {
      title?: string;
      video_id?: string;
      author?: string;
    }

    class Player {
      constructor(elementId: string | HTMLElement, options: PlayerOptions);
      destroy(): void;
      getVideoData(): VideoData;
      getPlaylist(): string[] | null;
      cueVideoById(videoId: string): void;
      cuePlaylist(options: { listType: "playlist"; list: string }): void;
    }
  }
}
