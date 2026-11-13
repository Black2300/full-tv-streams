export interface UserInfo {
  username: string;
  password: string;
  message?: string;
  auth: number;
  status: string;
  exp_date?: string;
  is_trial?: string;
  active_cons?: string;
  created_at?: string;
  max_connections?: string;
  allowed_output_formats?: string[];
}

export interface ServerInfo {
  xui?: boolean;
  version?: string;
  url?: string;
  port?: string;
  https_port?: string;
  server_protocol?: string;
  rtmp_port?: string;
  timestamp_now?: number;
  time_now?: string;
  timezone?: string;
}

export interface AuthResponse {
  user_info: UserInfo;
  server_info: ServerInfo;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export interface LiveStream {
  num?: number;
  name: string;
  stream_type: "live";
  stream_id: number;
  stream_icon?: string;
  epg_channel_id?: string | null;
  added?: string;
  category_id: string;
  custom_sid?: string;
  direct_source?: string;
}

export interface VodStream {
  num?: number;
  name: string;
  title?: string;
  year?: string;
  stream_type: "movie";
  stream_id: number;
  stream_icon?: string;
  rating?: number | string;
  rating_5based?: number;
  added?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  release_date?: string;
  releaseDate?: string;
  youtube_trailer?: string;
  episode_run_time?: string | number;
  category_id: string;
  container_extension?: string;
  custom_sid?: string;
  backdrop_path?: string[];
}

export interface SeriesItem {
  num?: number;
  name: string;
  title?: string;
  year?: string;
  stream_type: "series";
  series_id: number;
  cover?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  release_date?: string;
  releaseDate?: string;
  last_modified?: string;
  rating?: string | number;
  rating_5based?: number;
  backdrop_path?: string[];
  youtube_trailer?: string;
  episode_run_time?: string;
  category_id: string;
}

export interface EpisodeInfo {
  id: string | number;
  episode_num: number | string;
  title: string;
  container_extension: string;
  info?: {
    name?: string;
    cover_big?: string;
    movie_image?: string;
    duration_secs?: number;
    duration?: number | string;
    plot?: string;
    releasedate?: string;
  };
  season: number;
  custom_sid?: string;
}

export interface SeriesDetailResponse {
  seasons: {
    air_date?: string;
    episode_count?: number;
    id?: number;
    name?: string;
    overview?: string;
    season_number: number;
    cover?: string;
    cover_big?: string;
  }[];
  info: SeriesItem;
  episodes: Record<string, EpisodeInfo[]>;
}

export type PlayableItem =
  | {
      type: "live";
      id: number;
      title: string;
      poster?: string;
      category?: string;
      streamUrl: string;
      channelList?: LiveStream[];
    }
  | {
      type: "movie";
      id: number;
      title: string;
      poster?: string;
      backdrop?: string;
      category?: string;
      year?: string;
      rating?: string | number;
      plot?: string;
      cast?: string;
      director?: string;
      genre?: string;
      streamUrl: string;
      initialTime?: number;
    }
  | {
      type: "episode";
      id: number | string;
      seriesId: number;
      seriesTitle: string;
      title: string;
      season: number;
      episodeNum: number | string;
      category?: string;
      poster?: string;
      backdrop?: string;
      plot?: string;
      streamUrl: string;
      initialTime?: number;
      nextEpisode?: {
        id: number | string;
        title: string;
        season: number;
        episodeNum: number | string;
      };
    };

export interface WatchProgress {
  id: string;
  title: string;
  type: "movie" | "episode" | "live";
  currentTime: number;
  duration: number;
  progressPercent: number;
  poster?: string;
  timestamp: number;
  seriesId?: number;
  seriesTitle?: string;
  season?: number;
  episodeNum?: number | string;
}

export interface FavoriteItem {
  id: string;
  type: "live" | "movie" | "series";
  title: string;
  poster?: string;
  category?: string;
  year?: string;
  rating?: string | number;
  item: LiveStream | VodStream | SeriesItem;
}

export type MainTab = "home" | "live" | "movies" | "series" | "favorites";
