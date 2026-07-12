export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Ticket Box API Documentation",
    version: "1.0.0",
    description: "API specifications for the Ticket Box microservices architecture, routed via the API Gateway."
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local API Gateway"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "An error occurred" }
        }
      },
      SignUpInput: {
        type: "object",
        required: ["fullName", "email", "password"],
        properties: {
          fullName: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", minLength: 6, example: "secure123" }
        }
      },
      SignInInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", minLength: 6, example: "secure123" }
        }
      },
      RefreshTokenInput: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "jwt-refresh-token-string" }
        }
      },
      ConcertTicketType: {
        type: "object",
        required: ["name", "price", "maxPerUser", "totalCapacity", "saleStart", "saleEnd"],
        properties: {
          name: { type: "string", example: "VIP Standing" },
          price: { type: "number", example: 150 },
          maxPerUser: { type: "number", example: 4 },
          totalCapacity: { type: "number", example: 200 },
          saleStart: { type: "string", format: "date-time", example: "2026-07-12T12:00:00Z" },
          saleEnd: { type: "string", format: "date-time", example: "2026-07-20T12:00:00Z" }
        }
      },
      CreateConcertInput: {
        type: "object",
        required: ["title", "venue", "eventDate", "ticketTypes"],
        properties: {
          title: { type: "string", example: "The Eras Tour" },
          description: { type: "string", nullable: true, example: "Taylor Swift live concert." },
          venue: { type: "string", example: "Stadium Singapore" },
          eventDate: { type: "string", format: "date-time", example: "2026-08-01T19:00:00Z" },
          coverImage: { type: "string", format: "uri", nullable: true, example: "https://example.com/cover.jpg" },
          seatMapSvg: { type: "string", format: "uri", nullable: true, example: "https://example.com/seatmap.svg" },
          ticketTypes: {
            type: "array",
            items: { $ref: "#/components/schemas/ConcertTicketType" }
          }
        }
      },
      CreateOrderInput: {
        type: "object",
        required: ["paymentMethod", "data"],
        properties: {
          paymentMethod: { type: "string", enum: ["stripe"], example: "stripe" },
          data: {
            type: "array",
            items: {
              type: "object",
              required: ["concertId", "ticketTypeId", "quantity"],
              properties: {
                concertId: { type: "string", format: "uuid", example: "6f5b9d3e-9b7e-41d3-9f8d-4a1d8b7e6c3d" },
                ticketTypeId: { type: "string", format: "uuid", example: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d" },
                quantity: { type: "integer", minimum: 1, example: 2 }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    "/api/v1/auth/sign-up": {
      post: {
        tags: ["Auth"],
        summary: "Sign up a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignUpInput" }
            }
          }
        },
        responses: {
          201: {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User registered successfully" },
                    data: {
                      type: "object",
                      properties: {
                        userId: { type: "string", format: "uuid", example: "6f5b9d3e-9b7e-41d3-9f8d-4a1d8b7e6c3d" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/sign-in": {
      post: {
        tags: ["Auth"],
        summary: "Sign in a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignInInput" }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    data: {
                      type: "object",
                      properties: {
                        accessToken: { type: "string", example: "jwt-access-token" },
                        refreshToken: { type: "string", example: "jwt-refresh-token" },
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            email: { type: "string", format: "email" },
                            role: { type: "string", example: "AUDIENCE" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Request new access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenInput" }
            }
          }
        },
        responses: {
          200: {
            description: "Tokens refreshed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        accessToken: { type: "string" },
                        refreshToken: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/users/profile": {
      get: {
        tags: ["Users"],
        summary: "Get profile details",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        email: { type: "string" },
                        fullName: { type: "string" },
                        role: { type: "string" },
                        status: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/organizer/users": {
      get: {
        tags: ["Organizer Users"],
        summary: "List all users (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "BANNED", "INACTIVE"] } },
          { name: "role", in: "query", schema: { type: "string", enum: ["ORGANIZER", "STAFF", "AUDIENCE"] } }
        ],
        responses: {
          200: {
            description: "User list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          email: { type: "string" },
                          fullName: { type: "string" },
                          role: { type: "string" },
                          status: { type: "string" }
                        }
                      }
                    },
                    meta: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/organizer/users/{targetId}/role": {
      patch: {
        tags: ["Organizer Users"],
        summary: "Update user role (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "targetId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["ORGANIZER", "STAFF", "AUDIENCE"] }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Role updated successfully"
          }
        }
      }
    },
    "/api/v1/organizer/users/{targetId}/status": {
      patch: {
        tags: ["Organizer Users"],
        summary: "Update user status (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "targetId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["ACTIVE", "INACTIVE", "BANNED"] }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Status updated successfully"
          }
        }
      }
    },
    "/api/v1/concerts": {
      get: {
        tags: ["Concerts"],
        summary: "List public concerts",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
        ],
        responses: {
          200: {
            description: "Concerts list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          title: { type: "string" },
                          artists: { type: "array", items: { type: "string" } },
                          venue: { type: "string" },
                          eventDate: { type: "string", format: "date-time" },
                          status: { type: "string" },
                          coverImage: { type: "string", nullable: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/concerts/{concertId}": {
      get: {
        tags: ["Concerts"],
        summary: "Get public concert details",
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "Concert details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        description: { type: "string", nullable: true },
                        artists: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", format: "uuid" },
                              name: { type: "string" },
                              verifiedBio: { type: "string", nullable: true }
                            }
                          }
                        },
                        venue: { type: "string" },
                        eventDate: { type: "string", format: "date-time" },
                        coverImage: { type: "string", nullable: true },
                        seatMapSvg: { type: "string", nullable: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/concerts/{concertId}/ticket-types": {
      get: {
        tags: ["Concerts"],
        summary: "Get concert ticket types",
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "List of ticket types"
          }
        }
      }
    },
    "/api/v1/concerts/{concertId}/stocks": {
      get: {
        tags: ["Concerts"],
        summary: "Get concert ticket stocks",
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "List of ticket type stocks"
          }
        }
      }
    },
    "/api/v1/organizer/concerts": {
      post: {
        tags: ["Organizer Concerts"],
        summary: "Create a new concert (Organizer only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateConcertInput" }
            }
          }
        },
        responses: {
          201: {
            description: "Concert created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        concertId: { type: "string", format: "uuid" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/organizer/concerts/{concertId}": {
      patch: {
        tags: ["Organizer Concerts"],
        summary: "Update draft concert details (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string", nullable: true },
                  venue: { type: "string" },
                  eventDate: { type: "string", format: "date-time" },
                  coverImage: { type: "string", nullable: true },
                  seatMapSvg: { type: "string", nullable: true },
                  ticketTypes: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ConcertTicketType" }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Concert updated successfully"
          }
        }
      }
    },
    "/api/v1/organizer/concerts/{concertId}/update-status": {
      patch: {
        tags: ["Organizer Concerts"],
        summary: "Update concert status (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["DRAFT", "PUBLISHED", "CANCELLED"] }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Status updated successfully"
          }
        }
      }
    },
    "/api/v1/organizer/artists": {
      post: {
        tags: ["Organizer Artists"],
        summary: "Create artists (Organizer only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Artists resolved/created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        existingArtists: { type: "array", items: { type: "object" } },
                        newArtists: { type: "array", items: { type: "object" } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/organizer/artists/concerts/{concertId}/link-artist": {
      post: {
        tags: ["Organizer Artists"],
        summary: "Link artist IDs to concert (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["artistIds"],
                properties: {
                  artistIds: { type: "array", items: { type: "string", format: "uuid" } }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Artists linked successfully"
          }
        }
      }
    },
    "/api/v1/organizer/concerts/{concertId}/generate-bio": {
      post: {
        tags: ["Organizer Artists"],
        summary: "Upload PDF and request AI biographies (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["pdf", "artistIds"],
                properties: {
                  pdf: { type: "string", format: "binary" },
                  artistIds: { type: "string", description: "JSON stringified array of artist UUIDs" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "PDF uploaded successfully"
          }
        }
      }
    },
    "/api/v1/organizer/concerts/{concertId}/bio-review": {
      get: {
        tags: ["Organizer Artists"],
        summary: "Get awaiting review bios (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "Awaiting review bios list"
          }
        }
      }
    },
    "/api/v1/organizer/concerts/{concertId}/bio-review/{artistId}": {
      patch: {
        tags: ["Organizer Artists"],
        summary: "Approve or Reject AI bio status (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "artistId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["APPROVED", "REJECTED"] }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Bio status updated"
          }
        }
      }
    },
    "/api/v1/organizer/concerts/{concertId}/vip-guests": {
      get: {
        tags: ["Organizer Concerts"],
        summary: "Get VIP guest list (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: {
            description: "VIP guest list retrieved"
          }
        }
      }
    },
    "/api/v1/organizer/concerts/{concertId}/vip-guests/import": {
      post: {
        tags: ["Organizer Concerts"],
        summary: "Import VIP guest CSV list (Organizer only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["csv"],
                properties: {
                  csv: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "CSV imported successfully"
          }
        }
      }
    },
    "/api/v1/staff/concerts/concerts/{concertId}/vip-guests": {
      get: {
        tags: ["Staff VIP"],
        summary: "List VIP guests for staff check-in (Staff only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: {
            description: "VIP guest list retrieved"
          }
        }
      }
    },
    "/api/v1/staff/concerts/concerts/{concertId}/vip-guests/{vipGuestId}/check-in": {
      patch: {
        tags: ["Staff VIP"],
        summary: "Check-in a VIP guest (Staff only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "vipGuestId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "VIP guest checked in successfully"
          }
        }
      }
    },
    "/api/v1/orders": {
      post: {
        tags: ["Orders"],
        summary: "Create a ticket order",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderInput" }
            }
          }
        },
        responses: {
          201: {
            description: "Order created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        orderId: { type: "string", format: "uuid" },
                        totalPrice: { type: "number" },
                        paymentDeadline: { type: "string", format: "date-time" },
                        paymentUrl: { type: "string", format: "uri" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/orders/{orderId}/stream/payment-url": {
      get: {
        tags: ["Orders"],
        summary: "SSE stream to poll payment URL updates",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "SSE Stream"
          }
        }
      }
    },
    "/api/v1/orders/{orderId}/stream/order-confirm": {
      get: {
        tags: ["Orders"],
        summary: "SSE stream to poll order completion status",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "SSE Stream"
          }
        }
      }
    },
    "/api/v1/tickets": {
      get: {
        tags: ["Tickets"],
        summary: "Get tickets owned by current user",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
        ],
        responses: {
          200: {
            description: "Owned tickets list"
          }
        }
      }
    },
    "/api/v1/tickets/{ticketId}": {
      get: {
        tags: ["Tickets"],
        summary: "Get detailed ticket info and cryptographic signature",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "ticketId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "Ticket details and signature"
          }
        }
      }
    },
    "/api/v1/tickets/concerts/{concertId}": {
      get: {
        tags: ["Tickets"],
        summary: "Get owned tickets for specific concert",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "Tickets list"
          }
        }
      }
    },
    "/api/v1/checkin/public-key": {
      get: {
        tags: ["Check-in Gate (Staff)"],
        summary: "Get ED25519 public key to verify signatures",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "PEM public key"
          }
        }
      }
    },
    "/api/v1/checkin/verify": {
      post: {
        tags: ["Check-in Gate (Staff)"],
        summary: "Verify ticket QR code payload and check-in (Staff only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ticketId", "userId", "concertId", "ticketTypeId"],
                properties: {
                  ticketId: { type: "string", format: "uuid" },
                  userId: { type: "string", format: "uuid" },
                  concertId: { type: "string", format: "uuid" },
                  ticketTypeId: { type: "string", format: "uuid" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Ticket checked in successfully"
          }
        }
      }
    },
    "/api/v1/checkin/stats/{concertId}": {
      get: {
        tags: ["Check-in Gate (Staff)"],
        summary: "Get gate attendance stats (Staff only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "concertId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "Stats data"
          }
        }
      }
    },
    "/api/v1/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get notifications list",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: {
            description: "Notifications list"
          }
        }
      }
    },
    "/api/v1/notifications/stream": {
      get: {
        tags: ["Notifications"],
        summary: "SSE stream to receive live notification events",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "SSE Stream"
          }
        }
      }
    },
    "/api/v1/notifications/{notificationId}": {
      get: {
        tags: ["Notifications"],
        summary: "Get detailed notification record",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "notificationId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          200: {
            description: "Notification detail"
          }
        }
      }
    }
  }
};
