#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TwitterService } from "./x/services.js";
import { ApiRequestError } from "twitter-api-v2";
// Initialize the Twitter service
const twitterService = TwitterService.getInstance();

// Create an MCP server
const server = new McpServer(
  {
    name: "@redzumi/twitter-mcp",
    version: "1.0.2",
  },
  {
    capabilities: {
      tools: {
        get_tweets_by_userid: {
          description: "Get tweets by user ID",
          parameters: z.object({
            userId: z
              .string()
              .describe("The Twitter user ID to search for tweets"),
          }),
        },
        get_tweet_by_id: {
          description: "Get a tweet by ID",
          parameters: z.object({
            tweetId: z.string().describe("The ID of the tweet to retrieve"),
          }),
        },
        get_user_mentions: {
          description: "Get mentions by user ID",
          parameters: z.object({
            userId: z
              .string()
              .describe("The Twitter user ID to get mentions for"),
          }),
        },
        quote_tweet: {
          description: "Quote a tweet",
          parameters: z.object({
            tweetId: z.string().describe("The ID of the tweet to quote"),
            replyText: z
              .string()
              .describe("The text to include with the quote"),
          }),
        },
        reply_to_tweet: {
          description: "Reply to a tweet",
          parameters: z.object({
            tweetId: z.string().describe("The ID of the tweet to reply to"),
            replyText: z.string().describe("The text content of the reply"),
          }),
        },
        post_tweet: {
          description: "Post a tweet",
          parameters: z.object({
            text: z.string().describe("The text content of the tweet"),
            imageBase64: z
              .string()
              .optional()
              .describe("Optional base64 encoded image to attach to the tweet"),
          }),
        },
        like_tweet: {
          description: "Like a tweet",
          parameters: z.object({
            tweetId: z.string().describe("The ID of the tweet to like"),
          }),
        },
        follow_user: {
          description: "Follow a user",
          parameters: z.object({
            targetUserId: z.string().describe("The ID of the user to follow"),
          }),
        },
        unfollow_user: {
          description: "Unfollow a user",
          parameters: z.object({
            targetUserId: z.string().describe("The ID of the user to unfollow"),
          }),
        },
        get_user_by_username: {
          description: "Get a user by username",
          parameters: z.object({
            username: z
              .string()
              .describe("The Twitter username (without @ symbol)"),
          }),
        },
        search_tweets: {
          description: "Search for tweets",
          parameters: z.object({
            query: z.string().describe("The search query"),
            maxResults: z
              .number()
              .optional()
              .default(10)
              .describe("Maximum number of results to return"),
          }),
        },
        get_trending_topics: {
          description: "Get trending topics",
          parameters: z.object({
            woeid: z
              .number()
              .optional()
              .default(1)
              .describe(
                "The 'Where On Earth ID' (WOEID) for the location (1 for worldwide)"
              ),
          }),
        },
        create_list: {
          description: "Create a list",
          parameters: z.object({
            name: z.string().describe("The name of the list"),
            description: z
              .string()
              .optional()
              .describe("Optional description for the list"),
            isPrivate: z
              .boolean()
              .optional()
              .default(false)
              .describe("Whether the list should be private"),
          }),
        },
        add_list_member: {
          description: "Add a member to a list",
          parameters: z.object({
            listId: z.string().describe("The ID of the list"),
            userId: z.string().describe("The ID of the user to add"),
          }),
        },
        remove_list_member: {
          description: "Remove a member from a list",
          parameters: z.object({
            listId: z.string().describe("The ID of the list"),
            userId: z.string().describe("The ID of the user to remove"),
          }),
        },
        get_owned_lists: {
          description: "Get all lists owned by the authenticated user",
          parameters: z.object({}),
        },
      },
    },
  }
);

// Define Twitter tools
server.tool(
  "get_tweets_by_userid",
  {
    userId: z.string().describe("The Twitter user ID to search for tweets"),
    paginationToken: z
      .string()
      .optional()
      .describe("The pagination token to use for the next page of results"),
    exclude: z
      .array(z.enum(["retweets", "replies"]))
      .optional()
      .describe("The types of tweets to exclude from the search"),
    maxResults: z
      .number()
      .optional()
      .default(10)
      .describe("The maximum number of tweets to return"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ config, userId, paginationToken, exclude, maxResults }) => {
    const tweets = await twitterService.getUserTweets(
      config || {},
      userId,
      paginationToken,
      exclude,
      maxResults,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(tweets, null, 2) }],
    };
  }
);

server.tool(
  "get_tweet_by_id",
  {
    tweetId: z.string().describe("The ID of the tweet to retrieve"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ config, tweetId }) => {
    const tweet = await twitterService.getTweet(config || {}, tweetId);
    return {
      content: [{ type: "text", text: JSON.stringify(tweet, null, 2) }],
    };
  }
);

server.tool(
  "get_user_mentions",
  {
    userId: z.string().describe("The Twitter user ID to get mentions for"),
    paginationToken: z
      .string()
      .optional()
      .describe("The pagination token to use for the next page of results"),
    maxResults: z
      .number()
      .optional()
      .default(10)
      .describe("The maximum number of mentions to return"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ userId, paginationToken, maxResults, config }) => {
    const mentions = await twitterService.getUserMentionTimeline(
      config || {},
      userId,
      paginationToken,
      maxResults,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(mentions, null, 2) }],
    };
  }
);

server.tool(
  "quote_tweet",
  {
    tweetId: z.string().describe("The ID of the tweet to quote"),
    replyText: z.string().describe("The text to include with the quote"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ tweetId, replyText, config }) => {
    const quote = await twitterService.quoteAndComment(config || {}, tweetId, replyText);
    return {
      content: [{ type: "text", text: JSON.stringify(quote, null, 2) }],
    };
  }
);

server.tool(
  "reply_to_tweet",
  {
    tweetId: z.string().describe("The ID of the tweet to reply to"),
    replyText: z.string().describe("The text content of the reply"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }),
  },
  async ({ tweetId, replyText, config }) => {
    const reply = await twitterService.replyToTweet(config || {}, tweetId, replyText);
    return {
      content: [{ type: "text", text: JSON.stringify(reply, null, 2) }],
    };
  }
);

server.tool(
  "post_tweet",
  {
    text: z.string().describe("The text content of the tweet"),
    imageBase64: z
      .string()
      .optional()
      .describe("Optional base64 encoded image to attach to the tweet"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ text, imageBase64, config }) => {
    const tweet = await twitterService.postTweet(config || {}, text, imageBase64);
    return {
      content: [{ type: "text", text: JSON.stringify(tweet, null, 2) }],
    };
  }
);

server.tool(
  "like_tweet",
  {
    tweetId: z.string().describe("The ID of the tweet to like"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }),
  },
  async ({ tweetId, config }) => {
    const likeResult = await twitterService.likeTweet(config || {}, tweetId);
    return {
      content: [{ type: "text", text: JSON.stringify(likeResult, null, 2) }],
    };
  }
);

// New tools for user management
server.tool(
  "follow_user",
  {
    targetUserId: z.string().describe("The ID of the user to follow"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ targetUserId, config }) => {
    const followResult = await twitterService.followUser(config || {}, targetUserId);
    return {
      content: [{ type: "text", text: JSON.stringify(followResult, null, 2) }],
    };
  }
);

server.tool(
  "unfollow_user",
  {
    targetUserId: z.string().describe("The ID of the user to unfollow"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }),
  },
  async ({ targetUserId, config }) => {
    const unfollowResult = await twitterService.unfollowUser(config || {}, targetUserId);
    return {
      content: [
        { type: "text", text: JSON.stringify(unfollowResult, null, 2) },
      ],
    };
  }
);

server.tool(
  "get_user_by_username",
  {
    username: z.string().describe("The Twitter username (without @ symbol)"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ username, config }) => {
    const user = await twitterService.getUserByUsername(config || {}, username);
    return {
      content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
    };
  }
);

server.tool(
  "search_tweets",
  {
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of results to return"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }),
  },
  async ({ query, maxResults, config }) => {
    const tweets = await twitterService.searchTweets(config || {}, query, maxResults);
    return {
      content: [{ type: "text", text: JSON.stringify(tweets, null, 2) }],
    };
  }
);

server.tool(
  "get_trending_topics",
  {
    woeid: z
      .number()
      .optional()
      .default(1)
      .describe(
        "The 'Where On Earth ID' (WOEID) for the location (1 for worldwide)"
      ),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }),
  },
  async ({ woeid, config }) => {
    const trends = await twitterService.getTrendingTopics(config || {}, woeid);
    return {
      content: [{ type: "text", text: JSON.stringify(trends, null, 2) }],
    };
  }
);

// List management tools
server.tool(
  "create_list",
  {
    name: z.string().describe("The name of the list"),
    description: z
      .string()
      .optional()
      .describe("Optional description for the list"),
    isPrivate: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether the list should be private"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ name, description, isPrivate, config }) => {
    const list = await twitterService.createList(config || {}, name, description, isPrivate);
    return {
      content: [{ type: "text", text: JSON.stringify(list, null, 2) }],
    };
  }
);

server.tool(
  "add_list_member",
  {
    listId: z.string().describe("The ID of the list"),
    userId: z.string().describe("The ID of the user to add"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ listId, userId, config }) => {
    const result = await twitterService.addListMember(config || {}, listId, userId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "remove_list_member",
  {
    listId: z.string().describe("The ID of the list"),
    userId: z.string().describe("The ID of the user to remove"),
    config: z.object({
      accessToken: z
        .string()
        .optional()
        .describe("The access token to use for the search"),
      refreshToken: z
        .string()
        .optional()
        .describe("The refresh token to use for the search"),
    }).optional(),
  },
  async ({ listId, userId, config }) => {
    const result = await twitterService.removeListMember(config || {}, listId, userId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool("get_owned_lists", {
  config: z.object({
    accessToken: z
      .string()
      .optional()
      .describe("The access token to use for the search"),
  }).optional(),
}, async ({ config }) => {
  const lists = await twitterService.getOwnedLists(config || {});
  return {
    content: [{ type: "text", text: JSON.stringify(lists, null, 2) }],
  };
});

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
