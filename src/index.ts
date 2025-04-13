import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TwitterService } from './x/services.js';
import { ApiRequestError } from "twitter-api-v2";
// Initialize the Twitter service
const twitterService = TwitterService.getInstance();

// Create an MCP server
const server = new McpServer({
  name: "x-mcp-server-v2",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Define Twitter tools
server.tool("get_tweets_by_userid",
  {
    userId: z.string().describe("The Twitter user ID to search for tweets"),
    paginationToken: z.string().optional().describe("The pagination token to use for the next page of results"),
    exclude: z.array(z.enum(["retweets", "replies"])).optional().describe("The types of tweets to exclude from the search"),
    maxResults: z.number().optional().default(10).describe("The maximum number of tweets to return")
  },
  async ({ userId, paginationToken, exclude, maxResults }) => {
    const tweets = await twitterService.getUserTweets(userId, paginationToken, exclude, maxResults);
    return {
      content: [{ type: "text", text: JSON.stringify(tweets, null, 2) }]
    };
  }
);

server.tool("get_tweet_by_id",
  {
    tweetId: z.string().describe("The ID of the tweet to retrieve")
  },
  async ({ tweetId }) => {
    const tweet = await twitterService.getTweet(tweetId);
    return {
      content: [{ type: "text", text: JSON.stringify(tweet, null, 2) }]
    };
  }
);

server.tool("get_user_mentions",
  {
    userId: z.string().describe("The Twitter user ID to get mentions for"),
    paginationToken: z.string().optional().describe("The pagination token to use for the next page of results"),
    maxResults: z.number().optional().default(10).describe("The maximum number of mentions to return")
  },
  async ({ userId, paginationToken, maxResults }) => {
    const mentions = await twitterService.getUserMentionTimeline(userId, paginationToken, maxResults);
    return {
      content: [{ type: "text", text: JSON.stringify(mentions, null, 2) }]
    };
  }
);

server.tool("quote_tweet",
  {
    tweetId: z.string().describe("The ID of the tweet to quote"),
    replyText: z.string().describe("The text to include with the quote")
  },
  async ({ tweetId, replyText }) => {
    const quote = await twitterService.quoteAndComment(tweetId, replyText);
    return {
      content: [{ type: "text", text: JSON.stringify(quote, null, 2) }]
    };
  }
);

server.tool("reply_to_tweet",
  {
    tweetId: z.string().describe("The ID of the tweet to reply to"),
    replyText: z.string().describe("The text content of the reply")
  },
  async ({ tweetId, replyText }) => {
    const reply = await twitterService.replyToTweet(tweetId, replyText);
    return {
      content: [{ type: "text", text: JSON.stringify(reply, null, 2) }]
    };
  }
);

server.tool("post_tweet",
  {
    text: z.string().describe("The text content of the tweet")
  },
  async ({ text }) => {
    const tweet = await twitterService.postTweet(text);
    return {
      content: [{ type: "text", text: JSON.stringify(tweet, null, 2) }]
    };
  }
);

server.tool("like_tweet",
  {
    tweetId: z.string().describe("The ID of the tweet to like")
  },
  async ({ tweetId }) => {
    const likeResult = await twitterService.likeTweet(tweetId);
    return {
      content: [{ type: "text", text: JSON.stringify(likeResult, null, 2) }]
    };
  }
);

// New tools for user management
server.tool("follow_user",
  {
    targetUserId: z.string().describe("The ID of the user to follow")
  },
  async ({ targetUserId }) => {
    const followResult = await twitterService.followUser(targetUserId);
    return {
      content: [{ type: "text", text: JSON.stringify(followResult, null, 2) }]
    };
  }
);

server.tool("unfollow_user",
  {
    targetUserId: z.string().describe("The ID of the user to unfollow")
  },
  async ({ targetUserId }) => {
    const unfollowResult = await twitterService.unfollowUser(targetUserId);
    return {
      content: [{ type: "text", text: JSON.stringify(unfollowResult, null, 2) }]
    };
  }
);

server.tool("get_user_by_username",
  {
    username: z.string().describe("The Twitter username (without @ symbol)")
  },
  async ({ username }) => {
    const user = await twitterService.getUserByUsername(username);
    return {
      content: [{ type: "text", text: JSON.stringify(user, null, 2) }]
    };
  }
);

server.tool("search_tweets",
  {
    query: z.string().describe("The search query"),
    maxResults: z.number().optional().default(10).describe("Maximum number of results to return")
  },
  async ({ query, maxResults }) => {
    const tweets = await twitterService.searchTweets(query, maxResults);
    return {
      content: [{ type: "text", text: JSON.stringify(tweets, null, 2) }]
    };
  }
);

server.tool("get_trending_topics",
  {
    woeid: z.number().optional().default(1).describe("The 'Where On Earth ID' (WOEID) for the location (1 for worldwide)")
  },
  async ({ woeid }) => {
    const trends = await twitterService.getTrendingTopics(woeid);
    return {
      content: [{ type: "text", text: JSON.stringify(trends, null, 2) }]
    };
  }
);

// List management tools
server.tool("create_list",
  {
    name: z.string().describe("The name of the list"),
    description: z.string().optional().describe("Optional description for the list"),
    isPrivate: z.boolean().optional().default(false).describe("Whether the list should be private")
  },
  async ({ name, description, isPrivate }) => {
    const list = await twitterService.createList(name, description, isPrivate);
    return {
      content: [{ type: "text", text: JSON.stringify(list, null, 2) }]
    };
  }
);

server.tool("add_list_member",
  {
    listId: z.string().describe("The ID of the list"),
    userId: z.string().describe("The ID of the user to add")
  },
  async ({ listId, userId }) => {
    const result = await twitterService.addListMember(listId, userId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

server.tool("remove_list_member",
  {
    listId: z.string().describe("The ID of the list"),
    userId: z.string().describe("The ID of the user to remove")
  },
  async ({ listId, userId }) => {
    const result = await twitterService.removeListMember(listId, userId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);

server.tool("get_owned_lists",
  {},
  async () => {
    const lists = await twitterService.getOwnedLists();
    return {
      content: [{ type: "text", text: JSON.stringify(lists, null, 2) }]
    };
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);

