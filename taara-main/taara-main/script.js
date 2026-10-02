// ============================================================
// TAARA* PRIVATE CHAT - COMPLETE SCRIPT
// ============================================================

// -----------------------------
// SUPABASE
// -----------------------------

const SUPABASE_URL =
    "https://xfnktxdgzrhpllskaaus.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_UNog7YbR_628ZNmh3jBjpw_LSY64RlR";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ============================================================
// CONFIG
// ============================================================

const CHAT_MEDIA_BUCKET = "chat-media";

const MAX_FILE_SIZE =
    100 * 1024 * 1024; // 100 MB


// ============================================================
// DOM
// ============================================================

// Screens
const loginScreen =
    document.getElementById("loginScreen");

const createScreen =
    document.getElementById("createScreen");

const chatScreen =
    document.getElementById("chatScreen");

// Login
const loginForm =
    document.getElementById("loginForm");

const loginUsername =
    document.getElementById("loginUsername");

const loginPin =
    document.getElementById("loginPin");

const loginMessage =
    document.getElementById("loginMessage");

const showCreateButton =
    document.getElementById("showCreateButton");

// Create account
const createForm =
    document.getElementById("createForm");

const createUsername =
    document.getElementById("createUsername");

const createPin =
    document.getElementById("createPin");

const confirmPin =
    document.getElementById("confirmPin");

const createMessage =
    document.getElementById("createMessage");

const backToLoginButton =
    document.getElementById("backToLoginButton");

// Chat
const logoutButton =
    document.getElementById("logoutButton");

const loggedInUsername =
    document.getElementById("loggedInUsername");

// Conversations
const conversationList =
    document.getElementById("conversationList");

// Search
const userSearchForm =
    document.getElementById("userSearchForm");

const userSearchInput =
    document.getElementById("userSearchInput");

const userSearchMessage =
    document.getElementById("userSearchMessage");

const userSearchResult =
    document.getElementById("userSearchResult");

// Current chat
const currentChatTitle =
    document.getElementById("currentChatTitle");

const chatPresence =
    document.getElementById("chatPresence");

const typingIndicator =
    document.getElementById("typingIndicator");

// Messages
const messagesContainer =
    document.getElementById("messages");

// Message form
const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const attachButton =
    document.getElementById("attachButton");

const fileInput =
    document.getElementById("fileInput");

const voiceButton =
    document.getElementById("voiceButton");

const uploadStatus =
    document.getElementById("uploadStatus");


// ============================================================
// STATE
// ============================================================

let currentConversationId = null;

let currentChatUserId = null;

let currentChatUsername = null;

let currentUserId = null;

let realtimeChannel = null;

let globalPresenceChannel = null;

let chatPresenceChannel = null;

let typingTimeout = null;

let isTyping = false;

let mediaRecorder = null;

let mediaStream = null;

let audioChunks = [];

let isRecording = false;

let replyingToMessage = null;

const loadedMessages = new Map();

const reactionCache = new Map();

let globalPresenceStartedForUser = null;

let lastSeenTimer = null;


// ============================================================
// BASIC HELPERS
// ============================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


function formatFileSize(bytes) {

    if (!bytes) return "";

    if (bytes < 1024)
        return `${bytes} B`;

    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;

    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    return `${(
        bytes /
        (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
}


function formatTime(dateString) {

    const date =
        new Date(dateString);

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}


function showStatus(element, text, type = "") {

    if (!element) return;

    element.textContent = text;

    element.className =
        element.className
            .replace(/\s+(success|error|info)$/g, "");

    if (type)
        element.classList.add(type);
}


// ============================================================
// DYNAMIC FEATURE STYLES
// ============================================================

function injectFeatureStyles() {

    if (document.getElementById("taaraFeatureStyles"))
        return;

    const style =
        document.createElement("style");

    style.id = "taaraFeatureStyles";

    style.textContent = `

        .taara-message-tools {
            display:flex;
            gap:5px;
            margin-top:5px;
            align-items:center;
        }

        .taara-tool-button {
            border:0;
            background:rgba(0,0,0,.08);
            border-radius:8px;
            padding:4px 7px;
            cursor:pointer;
            font-size:13px;
        }

        .taara-tool-button:hover {
            background:rgba(0,0,0,.15);
        }

        .taara-action-wrapper {
            position:relative;
        }

        .taara-action-menu {
            position:absolute;
            z-index:1000;
            bottom:32px;
            right:0;
            min-width:130px;
            background:white;
            border:1px solid #ddd;
            border-radius:10px;
            padding:5px;
            box-shadow:0 8px 25px rgba(0,0,0,.15);
        }

        .taara-action-menu button {
            display:block;
            width:100%;
            border:0;
            background:none;
            padding:9px;
            text-align:left;
            border-radius:7px;
            cursor:pointer;
        }

        .taara-action-menu button:hover {
            background:#f1f1f1;
        }

        .taara-reaction-picker {
            position:absolute;
            z-index:1001;
            bottom:32px;
            left:0;
            background:white;
            border:1px solid #ddd;
            border-radius:12px;
            padding:7px;
            display:flex;
            gap:5px;
            box-shadow:0 8px 25px rgba(0,0,0,.15);
        }

        .taara-reaction-picker button {
            border:0;
            background:none;
            font-size:20px;
            cursor:pointer;
            padding:3px;
        }

        .taara-reactions {
            display:flex;
            flex-wrap:wrap;
            gap:4px;
            margin-top:5px;
        }

        .taara-reaction-chip {
            border:1px solid rgba(0,0,0,.1);
            background:rgba(255,255,255,.7);
            border-radius:12px;
            padding:2px 7px;
            cursor:pointer;
            font-size:13px;
        }

        .taara-reply-preview {
            border-left:3px solid #777;
            background:rgba(0,0,0,.06);
            padding:6px 9px;
            margin-bottom:6px;
            border-radius:6px;
            font-size:12px;
        }

        .taara-reply-author {
            font-weight:bold;
            margin-bottom:2px;
        }

        .taara-reply-bar {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:10px;
            padding:8px 12px;
            background:#f1f3f5;
            border-radius:10px;
            margin-bottom:7px;
        }

        .taara-reply-bar-text {
            overflow:hidden;
            flex:1;
        }

        .taara-reply-cancel {
            border:0;
            background:none;
            cursor:pointer;
            font-size:18px;
        }

        .taara-media-actions {
            display:flex;
            gap:6px;
            margin-top:6px;
        }

        .taara-media-actions a,
        .taara-media-actions button {
            text-decoration:none;
            border:0;
            border-radius:7px;
            padding:5px 8px;
            background:rgba(0,0,0,.08);
            cursor:pointer;
            color:inherit;
        }

        .taara-chat-image {
            max-width:280px;
            max-height:350px;
            border-radius:10px;
            cursor:pointer;
            display:block;
        }

        .taara-chat-video {
            max-width:300px;
            max-height:350px;
            border-radius:10px;
            display:block;
        }

        .taara-chat-audio {
            width:280px;
            max-width:100%;
        }

        .taara-image-modal {
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.9);
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        }

        .taara-image-modal img {
            max-width:95vw;
            max-height:90vh;
            object-fit:contain;
        }

        .taara-image-close {
            position:absolute;
            top:15px;
            right:20px;
            border:0;
            background:none;
            color:white;
            font-size:32px;
            cursor:pointer;
        }

        .taara-recording {
            background:#e53935 !important;
            color:white !important;
        }

        .taara-deleted-message {
            opacity:.65;
            font-style:italic;
        }

        .taara-edited-label {
            opacity:.6;
            font-size:11px;
            margin-left:4px;
        }

        .taara-file-card {
            display:flex;
            align-items:center;
            gap:10px;
        }

        .taara-file-icon {
            font-size:28px;
        }

        .taara-file-name {
            word-break:break-word;
        }
    `;

    document.head.appendChild(style);
}


// ============================================================
// SCREENS
// ============================================================

function showLogin() {

    if (loginScreen)
        loginScreen.style.display = "";

    if (createScreen)
        createScreen.style.display = "none";

    if (chatScreen)
        chatScreen.style.display = "none";
}


function showCreate() {

    if (loginScreen)
        loginScreen.style.display = "none";

    if (createScreen)
        createScreen.style.display = "";

    if (chatScreen)
        chatScreen.style.display = "none";
}


function showChat() {

    if (loginScreen)
        loginScreen.style.display = "none";

    if (createScreen)
        createScreen.style.display = "none";

    if (chatScreen)
        chatScreen.style.display = "";
}


// ============================================================
// CREATE ACCOUNT
// ============================================================

if (showCreateButton) {

    showCreateButton.addEventListener(
        "click",
        showCreate
    );
}


if (backToLoginButton) {

    backToLoginButton.addEventListener(
        "click",
        showLogin
    );
}


if (createForm) {

    createForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const username =
                createUsername.value
                    .trim()
                    .toLowerCase();

            const pin =
                createPin.value;

            const confirm =
                confirmPin.value;

            createMessage.textContent = "";

            if (!username || !pin) {

                createMessage.textContent =
                    "Please enter username and PIN.";

                return;
            }

            if (pin !== confirm) {

                createMessage.textContent =
                    "PINs do not match.";

                return;
            }

            try {

                createMessage.textContent =
                    "Creating account...";

                const response =
                    await fetch(
                        `${SUPABASE_URL}/functions/v1/taara-auth`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                action: "register",
                                username,
                                pin
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Account creation failed."
                    );
                }

                createMessage.textContent =
                    "Account created. You can login now.";

                createForm.reset();

                setTimeout(
                    showLogin,
                    1000
                );

            } catch (error) {

                console.error(error);

                createMessage.textContent =
                    error.message;
            }
        }
    );
}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const username =
                loginUsername.value
                    .trim()
                    .toLowerCase();

            const pin =
                loginPin.value;

            loginMessage.textContent = "";

            if (!username || !pin) {

                loginMessage.textContent =
                    "Enter username and PIN.";

                return;
            }

            try {

                loginMessage.textContent =
                    "Logging in...";

                const response =
                    await fetch(
                        `${SUPABASE_URL}/functions/v1/taara-auth`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                action: "login",
                                username,
                                pin
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Login failed."
                    );
                }

                const {
                    access_token,
                    refresh_token
                } = data;

                const {
                    error
                } =
                    await supabaseClient.auth.setSession({
                        access_token,
                        refresh_token
                    });

                if (error)
                    throw error;

                await setupLoggedInUser();

                await updateLastSeen();

                await loadConversations();

                startGlobalPresence();

                startLastSeenTimer();

                showChat();

                loginMessage.textContent = "";

            } catch (error) {

                console.error(error);

                loginMessage.textContent =
                    error.message;
            }
        }
    );
}


// ============================================================
// CURRENT USER
// ============================================================

async function setupLoggedInUser() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();

    if (error)
        throw error;

    if (!data.user)
        throw new Error("User session not found.");

    currentUserId =
        data.user.id;

    const {
        data: profile,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select("username")
            .eq("id", currentUserId)
            .single();

    if (profileError)
        throw profileError;

    if (loggedInUsername)
        loggedInUsername.textContent =
            profile.username;

    return profile;
}


// ============================================================
// LAST SEEN
// ============================================================

async function updateLastSeen() {

    if (!currentUserId)
        return;

    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({
                last_seen_at:
                    new Date().toISOString()
            })
            .eq("id", currentUserId);

    if (error)
        console.warn(
            "Last seen update failed:",
            error
        );
}


function startLastSeenTimer() {

    if (lastSeenTimer)
        clearInterval(lastSeenTimer);

    lastSeenTimer =
        setInterval(
            updateLastSeen,
            60 * 1000
        );
}


// ============================================================
// GLOBAL PRESENCE - FIXED
// ============================================================

async function startGlobalPresence() {

    try {

        if (!currentUserId) {
            console.warn(
                "No current user for global presence."
            );
            return;
        }

        // Do not create another channel for the same user
        if (
            globalPresenceChannel &&
            globalPresenceStartedForUser === currentUserId
        ) {
            return;
        }

        // Remove old channel
        if (globalPresenceChannel) {

            try {

                await supabaseClient.removeChannel(
                    globalPresenceChannel
                );

            } catch (error) {

                console.warn(
                    "Old global presence removal failed:",
                    error
                );
            }

            globalPresenceChannel = null;
        }

        globalPresenceStartedForUser =
            currentUserId;

        const channel =
            supabaseClient.channel(
                "taara-online-users",
                {
                    config: {
                        presence: {
                            key: currentUserId
                        }
                    }
                }
            );

        // ALL callbacks BEFORE subscribe()

        channel.on(
            "presence",
            {
                event: "sync"
            },
            () => {

                console.log(
                    "Global presence synced."
                );
            }
        );

        channel.on(
            "presence",
            {
                event: "join"
            },
            ({ key, newPresences }) => {

                console.log(
                    "Global user joined:",
                    key,
                    newPresences
                );
            }
        );

        channel.on(
            "presence",
            {
                event: "leave"
            },
            ({ key, leftPresences }) => {

                console.log(
                    "Global user left:",
                    key,
                    leftPresences
                );
            }
        );

        // Save reference before subscribing
        globalPresenceChannel =
            channel;

        // ONLY subscribe after all callbacks
        channel.subscribe(
            async (status) => {

                console.log(
                    "Global presence:",
                    status
                );

                if (
                    status === "SUBSCRIBED"
                ) {

                    try {

                        await channel.track({
                            user_id:
                                currentUserId,
                            online_at:
                                new Date().toISOString()
                        });

                        console.log(
                            "Global presence tracking started."
                        );

                    } catch (error) {

                        console.error(
                            "Presence track failed:",
                            error
                        );
                    }
                }
            }
        );

    } catch (error) {

        console.error(
            "Global presence failed:",
            error
        );
    }
}


// ============================================================
// SEARCH USERS
// ============================================================

if (userSearchForm) {

    userSearchForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const username =
                userSearchInput.value
                    .trim()
                    .toLowerCase();

            userSearchMessage.textContent = "";

            userSearchResult.innerHTML = "";

            if (!username) {

                userSearchMessage.textContent =
                    "Enter a username.";

                return;
            }

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("profiles")
                        .select("id, username")
                        .eq("username", username)
                        .maybeSingle();

                if (error)
                    throw error;

                if (!data) {

                    userSearchMessage.textContent =
                        "User not found.";

                    return;
                }

                if (data.id === currentUserId) {

                    userSearchMessage.textContent =
                        "You cannot chat with yourself.";

                    return;
                }

                const button =
                    document.createElement("button");

                button.type = "button";

                button.textContent =
                    `💬 Chat with @${data.username}`;

                button.addEventListener(
                    "click",
                    () => startConversation(
                        data.id,
                        data.username
                    )
                );

                userSearchResult.appendChild(
                    button
                );

            } catch (error) {

                console.error(error);

                userSearchMessage.textContent =
                    error.message;
            }
        }
    );
}


// ============================================================
// START CONVERSATION
// ============================================================

async function startConversation(
    otherUserId,
    otherUsername
) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "create_private_conversation",
                    {
                        other_user_id:
                            otherUserId
                    }
                );

        if (error)
            throw error;

        currentConversationId =
            data;

        currentChatUserId =
            otherUserId;

        currentChatUsername =
            otherUsername;

        await openConversation(
            otherUsername
        );

        await loadConversations();

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}


// ============================================================
// LOAD CONVERSATIONS
// ============================================================

async function loadConversations() {

    if (!conversationList)
        return;

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "get_my_conversations"
                );

        if (error)
            throw error;

        conversationList.innerHTML = "";

        if (!data || !data.length) {

            conversationList.innerHTML =
                "<p>No conversations yet.</p>";

            return;
        }

        data.forEach(
            (conversation) => {

                const item =
                    document.createElement("div");

                item.className =
                    "conversation-item";

                const username =
                    conversation.username ||
                    "Unknown";

                const preview =
                    conversation.last_message ||
                    "No messages yet";

                item.innerHTML = `
                    <div>
                        <strong>
                            @${escapeHtml(username)}
                        </strong>
                        <div>
                            ${escapeHtml(preview)}
                        </div>
                    </div>

                    ${
                        conversation.unread_count > 0
                            ? `
                                <span class="unread-badge">
                                    ${conversation.unread_count}
                                </span>
                              `
                            : ""
                    }
                `;

                item.addEventListener(
                    "click",
                    () => {

                        currentConversationId =
                            conversation.conversation_id;

                        currentChatUserId =
                            conversation.other_user_id;

                        currentChatUsername =
                            username;

                        openConversation(username);
                    }
                );

                conversationList.appendChild(
                    item
                );
            }
        );

    } catch (error) {

        console.error(
            "Load conversations failed:",
            error
        );
    }
}


// ============================================================
// OPEN CONVERSATION
// ============================================================

async function openConversation(username) {

    if (!currentConversationId)
        return;

    currentChatUsername =
        username;

    if (currentChatTitle)
        currentChatTitle.textContent =
            `@${username}`;

    messageInput.disabled = false;

    sendButton.disabled = false;

    attachButton.disabled = false;

    if (voiceButton)
        voiceButton.disabled = false;

    stopTyping();

    replyingToMessage = null;

    hideReplyBar();

    await loadMessages();

    await markConversationRead();

    startRealtimeMessages();

    startChatPresence();

    messageInput.focus();
}


// ============================================================
// LOAD MESSAGES
// ============================================================

async function loadMessages() {

    if (!currentConversationId)
        return;

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("messages")
                .select(`
                    id,
                    conversation_id,
                    sender_id,
                    content,
                    created_at,
                    message_type,
                    file_path,
                    file_name,
                    file_size,
                    mime_type,
                    reply_to,
                    edited_at,
                    deleted_at
                `)
                .eq(
                    "conversation_id",
                    currentConversationId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );

        if (error)
            throw error;

        loadedMessages.clear();

        messagesContainer.innerHTML = "";

        for (const message of data || []) {

            loadedMessages.set(
                message.id,
                message
            );

            await addMessageToScreen(
                message,
                currentUserId
            );
        }

        await loadAllReactions();

        scrollMessagesToBottom();

    } catch (error) {

        console.error(
            "Load messages failed:",
            error
        );
    }
}


// ============================================================
// MESSAGE SCREEN
// ============================================================

async function addMessageToScreen(
    message,
    loggedUserId
) {

    if (
        document.querySelector(
            `[data-message-id="${message.id}"]`
        )
    ) {
        return;
    }

    const own =
        message.sender_id === loggedUserId;

    const row =
        document.createElement("div");

    row.className =
        `message-row ${
            own ? "own" : "received"
        }`;

    row.dataset.messageId =
        message.id;

    const bubble =
        document.createElement("div");

    bubble.className =
        `message-bubble ${
            own
                ? "own-message"
                : "received-message"
        }`;

    // Deleted
    if (message.deleted_at) {

        const deleted =
            document.createElement("div");

        deleted.className =
            "taara-deleted-message";

        deleted.textContent =
            "Message deleted";

        bubble.appendChild(
            deleted
        );

    } else {

        // Reply preview
        if (message.reply_to) {

            const reply =
                createReplyPreview(
                    message.reply_to
                );

            bubble.appendChild(
                reply
            );
        }

        await renderMessageContent(
            bubble,
            message
        );
    }

    // Time
    const time =
        document.createElement("span");

    time.className =
        "message-time";

    time.textContent =
        formatTime(
            message.created_at
        );

    if (
        message.edited_at &&
        !message.deleted_at
    ) {

        const edited =
            document.createElement("span");

        edited.className =
            "taara-edited-label";

        edited.textContent =
            "(edited)";

        time.appendChild(
            edited
        );
    }

    bubble.appendChild(
        time
    );

    // Tools
    if (!message.deleted_at) {

        const tools =
            createMessageTools(
                message,
                own
            );

        bubble.appendChild(
            tools
        );
    }

    // Reaction summary
    const reactions =
        document.createElement("div");

    reactions.className =
        "taara-reactions";

    reactions.dataset.reactionsFor =
        message.id;

    bubble.appendChild(
        reactions
    );

    row.appendChild(
        bubble
    );

    messagesContainer.appendChild(
        row
    );

    renderReactionSummary(
        message.id
    );
}


// ============================================================
// MESSAGE CONTENT
// ============================================================

async function renderMessageContent(
    bubble,
    message
) {

    const type =
        message.message_type || "text";

    if (
        type === "image" ||
        (
            message.mime_type &&
            message.mime_type.startsWith("image/")
        )
    ) {

        const url =
            await createSignedUrl(
                message.file_path
            );

        if (!url)
            return;

        const img =
            document.createElement("img");

        img.src =
            url;

        img.alt =
            message.file_name ||
            "Image";

        img.className =
            "taara-chat-image";

        img.addEventListener(
            "click",
            () => openImageModal(url)
        );

        bubble.appendChild(
            img
        );

        bubble.appendChild(
            createMediaActions(
                url,
                message.file_name
            )
        );

        return;
    }


    if (
        type === "video" ||
        (
            message.mime_type &&
            message.mime_type.startsWith("video/")
        )
    ) {

        const url =
            await createSignedUrl(
                message.file_path
            );

        if (!url)
            return;

        const video =
            document.createElement("video");

        video.src =
            url;

        video.controls = true;

        video.playsInline = true;

        video.preload =
            "metadata";

        video.className =
            "taara-chat-video";

        bubble.appendChild(
            video
        );

        bubble.appendChild(
            createMediaActions(
                url,
                message.file_name
            )
        );

        return;
    }


    if (
        type === "audio" ||
        type === "voice" ||
        (
            message.mime_type &&
            message.mime_type.startsWith("audio/")
        )
    ) {

        const url =
            await createSignedUrl(
                message.file_path
            );

        if (!url)
            return;

        const audio =
            document.createElement("audio");

        audio.src =
            url;

        audio.controls = true;

        audio.preload =
            "metadata";

        audio.className =
            "taara-chat-audio";

        bubble.appendChild(
            audio
        );

        bubble.appendChild(
            createMediaActions(
                url,
                message.file_name
            )
        );

        return;
    }


    if (type === "file") {

        const url =
            await createSignedUrl(
                message.file_path
            );

        const card =
            document.createElement("div");

        card.className =
            "taara-file-card";

        const icon =
            document.createElement("div");

        icon.className =
            "taara-file-icon";

        icon.textContent =
            "📎";

        const details =
            document.createElement("div");

        const name =
            document.createElement("div");

        name.className =
            "taara-file-name";

        name.textContent =
            message.file_name ||
            "File";

        details.appendChild(
            name
        );

        if (message.file_size) {

            const size =
                document.createElement("small");

            size.textContent =
                formatFileSize(
                    message.file_size
                );

            details.appendChild(
                size
            );
        }

        card.appendChild(
            icon
        );

        card.appendChild(
            details
        );

        bubble.appendChild(
            card
        );

        if (url) {

            bubble.appendChild(
                createMediaActions(
                    url,
                    message.file_name
                )
            );
        }

        return;
    }


    const text =
        document.createElement("div");

    text.className =
        "message-text";

    text.textContent =
        message.content || "";

    bubble.appendChild(
        text
    );
}


// ============================================================
// SIGNED URL
// ============================================================

async function createSignedUrl(
    filePath
) {

    if (!filePath)
        return null;

    try {

        const {
            data,
            error
        } =
            await supabaseClient.storage
                .from(CHAT_MEDIA_BUCKET)
                .createSignedUrl(
                    filePath,
                    3600
                );

        if (error)
            throw error;

        return data?.signedUrl || null;

    } catch (error) {

        console.error(
            "Signed URL failed:",
            error
        );

        return null;
    }
}


// ============================================================
// MEDIA ACTIONS
// ============================================================

function createMediaActions(
    url,
    filename
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "taara-media-actions";

    const open =
        document.createElement("a");

    open.href =
        url;

    open.target =
        "_blank";

    open.rel =
        "noopener";

    open.textContent =
        "Open";

    const download =
        document.createElement("a");

    download.href =
        url;

    download.target =
        "_blank";

    download.rel =
        "noopener";

    download.download =
        filename || "download";

    download.textContent =
        "Download";

    wrapper.appendChild(
        open
    );

    wrapper.appendChild(
        download
    );

    return wrapper;
}


// ============================================================
// IMAGE MODAL
// ============================================================

function openImageModal(url) {

    const modal =
        document.createElement("div");

    modal.className =
        "taara-image-modal";

    const close =
        document.createElement("button");

    close.className =
        "taara-image-close";

    close.textContent =
        "×";

    const img =
        document.createElement("img");

    img.src =
        url;

    close.addEventListener(
        "click",
        () => modal.remove()
    );

    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === modal
            ) {
                modal.remove();
            }
        }
    );

    modal.appendChild(
        close
    );

    modal.appendChild(
        img
    );

    document.body.appendChild(
        modal
    );
}


// ============================================================
// REPLY
// ============================================================

function createReplyPreview(
    messageId
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "taara-reply-preview";

    const target =
        loadedMessages.get(
            messageId
        );

    const author =
        document.createElement("div");

    author.className =
        "taara-reply-author";

    if (!target) {

        author.textContent =
            "Reply";

    } else {

        author.textContent =
            target.sender_id === currentUserId
                ? "You"
                : `@${currentChatUsername}`;
    }

    const text =
        document.createElement("div");

    let preview =
        "Replied message";

    if (target) {

        if (target.deleted_at) {

            preview =
                "Message deleted";

        } else if (
            target.message_type !== "text"
        ) {

            preview =
                target.file_name ||
                "Attachment";

        } else {

            preview =
                target.content ||
                "Message";
        }
    }

    text.textContent =
        preview.length > 100
            ? preview.slice(0, 100) + "..."
            : preview;

    wrapper.appendChild(
        author
    );

    wrapper.appendChild(
        text
    );

    return wrapper;
}


function ensureReplyBar() {

    if (
        document.getElementById(
            "taaraReplyBar"
        )
    ) {
        return;
    }

    const bar =
        document.createElement("div");

    bar.id =
        "taaraReplyBar";

    bar.className =
        "taara-reply-bar";

    bar.hidden = true;

    const text =
        document.createElement("div");

    text.id =
        "taaraReplyBarText";

    text.className =
        "taara-reply-bar-text";

    const cancel =
        document.createElement("button");

    cancel.type =
        "button";

    cancel.className =
        "taara-reply-cancel";

    cancel.textContent =
        "×";

    cancel.addEventListener(
        "click",
        hideReplyBar
    );

    bar.appendChild(
        text
    );

    bar.appendChild(
        cancel
    );

    messageForm.parentNode.insertBefore(
        bar,
        messageForm
    );
}


function setReplyTarget(
    message
) {

    replyingToMessage =
        message;

    ensureReplyBar();

    const bar =
        document.getElementById(
            "taaraReplyBar"
        );

    const text =
        document.getElementById(
            "taaraReplyBarText"
        );

    if (!bar || !text)
        return;

    let preview =
        message.content ||
        message.file_name ||
        "Attachment";

    if (
        message.deleted_at
    ) {
        preview =
            "Message deleted";
    }

    text.textContent =
        `Replying to ${
            message.sender_id === currentUserId
                ? "yourself"
                : `@${currentChatUsername}`
        }: ${preview}`;

    bar.hidden =
        false;

    messageInput.focus();
}


function hideReplyBar() {

    replyingToMessage =
        null;

    const bar =
        document.getElementById(
            "taaraReplyBar"
        );

    if (bar)
        bar.hidden = true;
}


// ============================================================
// MESSAGE TOOLS
// ============================================================

function createMessageTools(
    message,
    own
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "taara-message-tools";

    // Reaction
    const reactionWrapper =
        document.createElement("div");

    reactionWrapper.className =
        "taara-action-wrapper";

    const reactionButton =
        document.createElement("button");

    reactionButton.type =
        "button";

    reactionButton.className =
        "taara-tool-button";

    reactionButton.textContent =
        "😊";

    reactionButton.title =
        "React";

    reactionButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            closeAllMenus();

            toggleReactionPicker(
                reactionWrapper,
                message
            );
        }
    );

    reactionWrapper.appendChild(
        reactionButton
    );

    wrapper.appendChild(
        reactionWrapper
    );


    // Actions
    const actionWrapper =
        document.createElement("div");

    actionWrapper.className =
        "taara-action-wrapper";

    const actionButton =
        document.createElement("button");

    actionButton.type =
        "button";

    actionButton.className =
        "taara-tool-button";

    actionButton.textContent =
        "⋯";

    actionButton.title =
        "Actions";

    actionButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            closeAllMenus();

            const menu =
                createActionMenu(
                    message,
                    own
                );

            actionWrapper.appendChild(
                menu
            );
        }
    );

    actionWrapper.appendChild(
        actionButton
    );

    wrapper.appendChild(
        actionWrapper
    );

    return wrapper;
}


function closeAllMenus() {

    document
        .querySelectorAll(
            ".taara-action-menu, .taara-reaction-picker"
        )
        .forEach(
            element => element.remove()
        );
}


function createActionMenu(
    message,
    own
) {

    const menu =
        document.createElement("div");

    menu.className =
        "taara-action-menu";

    // Reply
    const reply =
        document.createElement("button");

    reply.textContent =
        "↩ Reply";

    reply.addEventListener(
        "click",
        () => {

            menu.remove();

            setReplyTarget(
                message
            );
        }
    );

    menu.appendChild(
        reply
    );


    // Copy
    if (
        message.message_type === "text" &&
        message.content
    ) {

        const copy =
            document.createElement("button");

        copy.textContent =
            "📋 Copy";

        copy.addEventListener(
            "click",
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        message.content
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Copy failed."
                    );
                }

                menu.remove();
            }
        );

        menu.appendChild(
            copy
        );
    }


    // Edit
    if (
        own &&
        message.message_type === "text" &&
        !message.deleted_at
    ) {

        const edit =
            document.createElement("button");

        edit.textContent =
            "✏️ Edit";

        edit.addEventListener(
            "click",
            async () => {

                menu.remove();

                const newText =
                    prompt(
                        "Edit message:",
                        message.content || ""
                    );

                if (
                    newText === null
                )
                    return;

                const text =
                    newText.trim();

                if (!text)
                    return;

                const {
                    error
                } =
                    await supabaseClient
                        .from("messages")
                        .update({
                            content: text,
                            edited_at:
                                new Date().toISOString()
                        })
                        .eq(
                            "id",
                            message.id
                        )
                        .eq(
                            "sender_id",
                            currentUserId
                        );

                if (error) {

                    console.error(
                        error
                    );

                    alert(
                        error.message
                    );

                    return;
                }

                await loadMessages();
            }
        );

        menu.appendChild(
            edit
        );
    }


    // Delete
    if (
        own &&
        !message.deleted_at
    ) {

        const del =
            document.createElement("button");

        del.textContent =
            "🗑 Delete";

        del.addEventListener(
            "click",
            async () => {

                menu.remove();

                const confirmed =
                    confirm(
                        "Delete this message?"
                    );

                if (!confirmed)
                    return;

                const {
                    error
                } =
                    await supabaseClient
                        .from("messages")
                        .update({
                            content: "",
                            deleted_at:
                                new Date().toISOString(),
                            edited_at: null
                        })
                        .eq(
                            "id",
                            message.id
                        )
                        .eq(
                            "sender_id",
                            currentUserId
                        );

                if (error) {

                    console.error(
                        error
                    );

                    alert(
                        error.message
                    );

                    return;
                }

                await loadMessages();
            }
        );

        menu.appendChild(
            del
        );
    }

    return menu;
}


// ============================================================
// REACTIONS
// ============================================================

const REACTIONS = [
    "❤️",
    "😂",
    "👍",
    "😮",
    "😢",
    "🔥"
];


function toggleReactionPicker(
    wrapper,
    message
) {

    const existing =
        wrapper.querySelector(
            ".taara-reaction-picker"
        );

    if (existing) {

        existing.remove();

        return;
    }

    const picker =
        document.createElement("div");

    picker.className =
        "taara-reaction-picker";

    REACTIONS.forEach(
        reaction => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.textContent =
                reaction;

            button.addEventListener(
                "click",
                async (event) => {

                    event.stopPropagation();

                    picker.remove();

                    await toggleReaction(
                        message.id,
                        reaction
                    );
                }
            );

            picker.appendChild(
                button
            );
        }
    );

    wrapper.appendChild(
        picker
    );
}


async function toggleReaction(
    messageId,
    reaction
) {

    try {

        const {
            data: existing,
            error: selectError
        } =
            await supabaseClient
                .from("message_reactions")
                .select("id")
                .eq(
                    "message_id",
                    messageId
                )
                .eq(
                    "user_id",
                    currentUserId
                )
                .eq(
                    "reaction",
                    reaction
                )
                .maybeSingle();

        if (selectError)
            throw selectError;

        if (existing) {

            const {
                error
            } =
                await supabaseClient
                    .from("message_reactions")
                    .delete()
                    .eq(
                        "id",
                        existing.id
                    );

            if (error)
                throw error;

        } else {

            const {
                error
            } =
                await supabaseClient
                    .from("message_reactions")
                    .insert({
                        message_id:
                            messageId,
                        user_id:
                            currentUserId,
                        reaction
                    });

            if (error)
                throw error;
        }

        await loadReactionsForMessage(
            messageId
        );

    } catch (error) {

        console.error(
            "Reaction failed:",
            error
        );

        alert(error.message);
    }
}


async function loadAllReactions() {

    reactionCache.clear();

    const messageIds =
        Array.from(
            loadedMessages.keys()
        );

    if (!messageIds.length)
        return;

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("message_reactions")
                .select(`
                    id,
                    message_id,
                    user_id,
                    reaction,
                    created_at
                `)
                .in(
                    "message_id",
                    messageIds
                );

        if (error)
            throw error;

        (data || []).forEach(
            reaction => {

                if (
                    !reactionCache.has(
                        reaction.message_id
                    )
                ) {

                    reactionCache.set(
                        reaction.message_id,
                        []
                    );
                }

                reactionCache
                    .get(
                        reaction.message_id
                    )
                    .push(reaction);
            }
        );

        messageIds.forEach(
            renderReactionSummary
        );

    } catch (error) {

        console.error(
            "Load reactions failed:",
            error
        );
    }
}


async function loadReactionsForMessage(
    messageId
) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("message_reactions")
                .select(`
                    id,
                    message_id,
                    user_id,
                    reaction,
                    created_at
                `)
                .eq(
                    "message_id",
                    messageId
                );

        if (error)
            throw error;

        reactionCache.set(
            messageId,
            data || []
        );

        renderReactionSummary(
            messageId
        );

    } catch (error) {

        console.error(
            "Reaction refresh failed:",
            error
        );
    }
}


function renderReactionSummary(
    messageId
) {

    const container =
        document.querySelector(
            `[data-reactions-for="${messageId}"]`
        );

    if (!container)
        return;

    container.innerHTML = "";

    const reactions =
        reactionCache.get(
            messageId
        ) || [];

    const grouped =
        {};

    reactions.forEach(
        item => {

            if (!grouped[item.reaction])
                grouped[item.reaction] = 0;

            grouped[item.reaction]++;
        }
    );

    Object.entries(grouped)
        .forEach(
            ([reaction, count]) => {

                const chip =
                    document.createElement("button");

                chip.type =
                    "button";

                chip.className =
                    "taara-reaction-chip";

                chip.textContent =
                    `${reaction} ${count}`;

                chip.addEventListener(
                    "click",
                    () => toggleReaction(
                        messageId,
                        reaction
                    )
                );

                container.appendChild(
                    chip
                );
            }
        );
}


// ============================================================
// SEND TEXT MESSAGE
// ============================================================

if (messageForm) {

    messageForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (
                !currentConversationId ||
                !currentUserId
            )
                return;

            const text =
                messageInput.value.trim();

            if (!text)
                return;

            sendButton.disabled =
                true;

            try {

                const {
                    error
                } =
                    await supabaseClient
                        .from("messages")
                        .insert({
                            conversation_id:
                                currentConversationId,
                            sender_id:
                                currentUserId,
                            content:
                                text,
                            message_type:
                                "text",
                            reply_to:
                                replyingToMessage
                                    ? replyingToMessage.id
                                    : null
                        });

                if (error)
                    throw error;

                messageInput.value = "";

                hideReplyBar();

                stopTyping();

                await loadMessages();

                await loadConversations();

                scrollMessagesToBottom();

            } catch (error) {

                console.error(
                    "Send message failed:",
                    error
                );

                alert(error.message);

            } finally {

                sendButton.disabled =
                    false;

                messageInput.focus();
            }
        }
    );
}


// ============================================================
// FILE ATTACHMENT
// ============================================================

if (attachButton) {

    attachButton.addEventListener(
        "click",
        () => {

            if (fileInput)
                fileInput.click();
        }
    );
}


if (fileInput) {

    fileInput.addEventListener(
        "change",
        async () => {

            const file =
                fileInput.files?.[0];

            if (!file)
                return;

            await uploadFile(file);

            fileInput.value = "";
        }
    );
}


async function uploadFile(file) {

    if (!currentConversationId)
        return;

    if (
        file.size >
        MAX_FILE_SIZE
    ) {

        alert(
            "Maximum file size is 100 MB."
        );

        return;
    }

    try {

        const {
            data: userData,
            error: userError
        } =
            await supabaseClient.auth.getUser();

        if (userError)
            throw userError;

        if (!userData.user)
            throw new Error(
                "User session not found."
            );

        const loggedUserId =
            userData.user.id;

        attachButton.disabled =
            true;

        sendButton.disabled =
            true;

        if (voiceButton)
            voiceButton.disabled =
                true;

        if (uploadStatus)
            uploadStatus.textContent =
                "Uploading...";

        const safeName =
            file.name
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

        const uniqueName =
            `${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}_${safeName}`;

        const filePath =
            `${currentConversationId}/${loggedUserId}/${uniqueName}`;

        const {
            error: uploadError
        } =
            await supabaseClient.storage
                .from(CHAT_MEDIA_BUCKET)
                .upload(
                    filePath,
                    file,
                    {
                        upsert: false
                    }
                );

        if (uploadError)
            throw uploadError;

        const mime =
            file.type || "";

        let messageType =
            "file";

        if (
            mime.startsWith("image/")
        ) {

            messageType =
                "image";

        } else if (
            mime.startsWith("video/")
        ) {

            messageType =
                "video";

        } else if (
            mime.startsWith("audio/")
        ) {

            messageType =
                "audio";
        }

        const {
            error: insertError
        } =
            await supabaseClient
                .from("messages")
                .insert({
                    conversation_id:
                        currentConversationId,
                    sender_id:
                        loggedUserId,
                    content: "",
                    message_type:
                        messageType,
                    file_path:
                        filePath,
                    file_name:
                        file.name,
                    file_size:
                        file.size,
                    mime_type:
                        mime
                });

        if (insertError) {

            await supabaseClient.storage
                .from(CHAT_MEDIA_BUCKET)
                .remove([
                    filePath
                ]);

            throw insertError;
        }

        if (uploadStatus)
            uploadStatus.textContent =
                "Uploaded.";

        await loadMessages();

        await loadConversations();

    } catch (error) {

        console.error(
            "File upload failed:",
            error
        );

        if (uploadStatus)
            uploadStatus.textContent =
                `Upload failed: ${error.message}`;

    } finally {

        attachButton.disabled =
            false;

        sendButton.disabled =
            false;

        if (voiceButton)
            voiceButton.disabled =
                false;

        setTimeout(
            () => {

                if (uploadStatus)
                    uploadStatus.textContent =
                        "";

            },
            2000
        );
    }
}


// ============================================================
// VOICE MESSAGE
// ============================================================

if (voiceButton) {

    voiceButton.addEventListener(
        "click",
        toggleVoiceRecording
    );
}


async function toggleVoiceRecording() {

    if (isRecording) {

        stopVoiceRecording();

        return;
    }

    await startVoiceRecording();
}


function getSupportedAudioMimeType() {

    const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg"
    ];

    for (const type of types) {

        if (
            window.MediaRecorder &&
            MediaRecorder.isTypeSupported(type)
        ) {
            return type;
        }
    }

    return "";
}


async function startVoiceRecording() {

    if (!currentConversationId) {

        alert(
            "Open a conversation first."
        );

        return;
    }

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        alert(
            "Microphone access is not available in this browser. Use HTTPS or localhost."
        );

        return;
    }

    if (
        !window.MediaRecorder
    ) {

        alert(
            "Voice recording is not supported by this browser."
        );

        return;
    }

    try {

        mediaStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        audioChunks = [];

        const mimeType =
            getSupportedAudioMimeType();

        mediaRecorder =
            mimeType
                ? new MediaRecorder(
                    mediaStream,
                    {
                        mimeType
                    }
                )
                : new MediaRecorder(
                    mediaStream
                );

        mediaRecorder.ondataavailable =
            (event) => {

                if (
                    event.data &&
                    event.data.size > 0
                ) {

                    audioChunks.push(
                        event.data
                    );
                }
            };

        mediaRecorder.onerror =
            (event) => {

                console.error(
                    "MediaRecorder error:",
                    event.error
                );

                stopVoiceRecording();
            };

        mediaRecorder.onstop =
            async () => {

                try {

                    const finalType =
                        mediaRecorder.mimeType ||
                        mimeType ||
                        "audio/webm";

                    const blob =
                        new Blob(
                            audioChunks,
                            {
                                type:
                                    finalType
                            }
                        );

                    audioChunks = [];

                    if (
                        blob.size > 0
                    ) {

                        const extension =
                            finalType.includes(
                                "ogg"
                            )
                                ? "ogg"
                                : "webm";

                        const file =
                            new File(
                                [
                                    blob
                                ],
                                `voice_${Date.now()}.${extension}`,
                                {
                                    type:
                                        finalType
                                }
                            );

                        await uploadVoiceMessage(
                            file
                        );

                    } else {

                        alert(
                            "No voice data was recorded."
                        );
                    }

                } catch (error) {

                    console.error(
                        "Voice processing failed:",
                        error
                    );

                    alert(
                        `Voice recording failed: ${error.message}`
                    );

                } finally {

                    if (mediaStream) {

                        mediaStream
                            .getTracks()
                            .forEach(
                                track =>
                                    track.stop()
                            );

                        mediaStream = null;
                    }

                    mediaRecorder =
                        null;

                    isRecording =
                        false;

                    updateVoiceButton();
                }
            };

        mediaRecorder.start(
            250
        );

        isRecording =
            true;

        updateVoiceButton();

        if (uploadStatus)
            uploadStatus.textContent =
                "🔴 Recording... Click 🎤 again to stop.";

    } catch (error) {

        console.error(
            "Microphone error:",
            error
        );

        if (
            error.name ===
            "NotAllowedError"
        ) {

            alert(
                "Microphone permission was denied. Allow microphone access for this site and try again."
            );

        } else if (
            error.name ===
            "NotFoundError"
        ) {

            alert(
                "No microphone was found on this device."
            );

        } else {

            alert(
                `Microphone error: ${error.message}`
            );
        }

        isRecording =
            false;

        updateVoiceButton();
    }
}


function stopVoiceRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
    ) {

        mediaRecorder.stop();

        return;
    }

    if (mediaStream) {

        mediaStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        mediaStream =
            null;
    }

    isRecording =
        false;

    updateVoiceButton();
}


function updateVoiceButton() {

    if (!voiceButton)
        return;

    if (isRecording) {

        voiceButton.textContent =
            "⏹️";

        voiceButton.title =
            "Stop recording";

        voiceButton.classList.add(
            "taara-recording"
        );

    } else {

        voiceButton.textContent =
            "🎤";

        voiceButton.title =
            "Voice message";

        voiceButton.classList.remove(
            "taara-recording"
        );
    }
}


async function uploadVoiceMessage(
    file
) {

    if (
        !currentConversationId ||
        !currentUserId
    ) {

        alert(
            "Open a conversation first."
        );

        return;
    }

    try {

        if (uploadStatus)
            uploadStatus.textContent =
                "Uploading voice message...";

        const safeName =
            file.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );

        const uniqueName =
            `${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}_${safeName}`;

        const filePath =
            `${currentConversationId}/${currentUserId}/${uniqueName}`;

        const {
            error: uploadError
        } =
            await supabaseClient.storage
                .from(CHAT_MEDIA_BUCKET)
                .upload(
                    filePath,
                    file,
                    {
                        upsert: false,
                        contentType:
                            file.type
                    }
                );

        if (uploadError)
            throw uploadError;

        const {
            error: insertError
        } =
            await supabaseClient
                .from("messages")
                .insert({
                    conversation_id:
                        currentConversationId,
                    sender_id:
                        currentUserId,
                    content: "",
                    message_type:
                        "audio",
                    file_path:
                        filePath,
                    file_name:
                        file.name,
                    file_size:
                        file.size,
                    mime_type:
                        file.type
                });

        if (insertError) {

            await supabaseClient.storage
                .from(CHAT_MEDIA_BUCKET)
                .remove([
                    filePath
                ]);

            throw insertError;
        }

        if (uploadStatus)
            uploadStatus.textContent =
                "Voice message sent.";

        await loadMessages();

        await loadConversations();

    } catch (error) {

        console.error(
            "Voice upload failed:",
            error
        );

        if (uploadStatus)
            uploadStatus.textContent =
                `Voice upload failed: ${error.message}`;

    } finally {

        setTimeout(
            () => {

                if (uploadStatus)
                    uploadStatus.textContent =
                        "";

            },
            2000
        );
    }
}


// ============================================================
// REALTIME MESSAGES
// ============================================================

function startRealtimeMessages() {

    if (!currentConversationId)
        return;

    if (realtimeChannel) {

        supabaseClient.removeChannel(
            realtimeChannel
        );

        realtimeChannel =
            null;
    }

    realtimeChannel =
        supabaseClient.channel(
            `messages-${currentConversationId}`
        );


    // New messages
    realtimeChannel.on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter:
                `conversation_id=eq.${currentConversationId}`
        },
        async (payload) => {

            const message =
                payload.new;

            if (
                loadedMessages.has(
                    message.id
                )
            ) {
                return;
            }

            loadedMessages.set(
                message.id,
                message
            );

            await addMessageToScreen(
                message,
                currentUserId
            );

            await loadReactionsForMessage(
                message.id
            );

            await markConversationRead();

            await loadConversations();

            scrollMessagesToBottom();
        }
    );


    // Message updates
    realtimeChannel.on(
        "postgres_changes",
        {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter:
                `conversation_id=eq.${currentConversationId}`
        },
        async () => {

            await loadMessages();

            await loadConversations();
        }
    );


    // Message deletes
    realtimeChannel.on(
        "postgres_changes",
        {
            event: "DELETE",
            schema: "public",
            table: "messages"
        },
        async (payload) => {

            const messageId =
                payload.old?.id;

            if (
                messageId &&
                loadedMessages.has(
                    messageId
                )
            ) {

                await loadMessages();
            }
        }
    );


    // Reactions
    realtimeChannel.on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "message_reactions"
        },
        async (payload) => {

            const messageId =
                payload.new?.message_id;

            if (
                messageId &&
                loadedMessages.has(
                    messageId
                )
            ) {

                await loadReactionsForMessage(
                    messageId
                );
            }
        }
    );


    realtimeChannel.on(
        "postgres_changes",
        {
            event: "DELETE",
            schema: "public",
            table: "message_reactions"
        },
        async (payload) => {

            const messageId =
                payload.old?.message_id;

            if (
                messageId &&
                loadedMessages.has(
                    messageId
                )
            ) {

                await loadReactionsForMessage(
                    messageId
                );
            }
        }
    );


    realtimeChannel.subscribe(
        (status) => {

            console.log(
                "Message realtime:",
                status
            );
        }
    );
}


// ============================================================
// CHAT PRESENCE
// ============================================================

async function startChatPresence() {

    if (!currentConversationId)
        return;

    if (chatPresenceChannel) {

        try {

            await supabaseClient.removeChannel(
                chatPresenceChannel
            );

        } catch (error) {

            console.warn(
                "Old chat presence removal failed:",
                error
            );
        }

        chatPresenceChannel =
            null;
    }

    const channel =
        supabaseClient.channel(
            `presence-${currentConversationId}`,
            {
                config: {
                    presence: {
                        key:
                            currentUserId
                    }
                }
            }
        );


    // IMPORTANT:
    // Every callback BEFORE subscribe()

    channel.on(
        "presence",
        {
            event: "sync"
        },
        () => {

            updateChatPresence(
                channel
            );
        }
    );


    channel.on(
        "presence",
        {
            event: "join"
        },
        () => {

            updateChatPresence(
                channel
            );
        }
    );


    channel.on(
        "presence",
        {
            event: "leave"
        },
        () => {

            updateChatPresence(
                channel
            );
        }
    );


    channel.on(
        "broadcast",
        {
            event: "typing"
        },
        ({ payload }) => {

            if (
                payload?.user_id ===
                currentUserId
            )
                return;

            if (
                typingIndicator
            ) {

                typingIndicator.textContent =
                    payload?.isTyping
                        ? `${currentChatUsername} is typing...`
                        : "";
            }
        }
    );


    chatPresenceChannel =
        channel;


    channel.subscribe(
        async (status) => {

            console.log(
                "Chat presence:",
                status
            );

            if (
                status === "SUBSCRIBED"
            ) {

                try {

                    await channel.track({
                        user_id:
                            currentUserId,
                        username:
                            loggedInUsername?.textContent ||
                            "",
                        online_at:
                            new Date().toISOString()
                    });

                    updateChatPresence(
                        channel
                    );

                } catch (error) {

                    console.error(
                        "Chat presence tracking failed:",
                        error
                    );
                }
            }
        }
    );
}


function updateChatPresence(
    channel
) {

    if (!chatPresence)
        return;

    const state =
        channel.presenceState();

    const otherUserOnline =
        Object.keys(state)
            .some(
                key =>
                    key !==
                    currentUserId
            );

    chatPresence.textContent =
        otherUserOnline
            ? "● Online"
            : "";
}


// ============================================================
// TYPING
// ============================================================

if (messageInput) {

    messageInput.addEventListener(
        "input",
        () => {

            sendTypingState(
                true
            );

            clearTimeout(
                typingTimeout
            );

            typingTimeout =
                setTimeout(
                    () => {
                        sendTypingState(
                            false
                        );
                    },
                    1200
                );
        }
    );
}


async function sendTypingState(
    typing
) {

    if (
        !chatPresenceChannel ||
        !currentUserId
    )
        return;

    try {

        await chatPresenceChannel.send({
            type: "broadcast",
            event: "typing",
            payload: {
                user_id:
                    currentUserId,
                isTyping:
                    typing
            }
        });

    } catch (error) {

        console.warn(
            "Typing broadcast failed:",
            error
        );
    }
}


function stopTyping() {

    clearTimeout(
        typingTimeout
    );

    typingTimeout =
        null;

    isTyping =
        false;

    if (typingIndicator)
        typingIndicator.textContent =
            "";
}


// ============================================================
// MARK AS READ
// ============================================================

async function markConversationRead() {

    if (
        !currentConversationId ||
        !currentUserId
    )
        return;

    try {

        // Keep this compatible with the existing
        // conversation/message setup.
        // If your project already has a read RPC,
        // use it here.

    } catch (error) {

        console.warn(
            "Mark read failed:",
            error
        );
    }
}


// ============================================================
// SCROLL
// ============================================================

function scrollMessagesToBottom() {

    if (!messagesContainer)
        return;

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                stopTyping();

                if (mediaRecorder) {

                    try {
                        stopVoiceRecording();
                    } catch (_) {}
                }

                if (chatPresenceChannel) {

                    await supabaseClient.removeChannel(
                        chatPresenceChannel
                    );

                    chatPresenceChannel =
                        null;
                }

                if (globalPresenceChannel) {

                    await supabaseClient.removeChannel(
                        globalPresenceChannel
                    );

                    globalPresenceChannel =
                        null;
                }

                globalPresenceStartedForUser =
                    null;

                if (realtimeChannel) {

                    await supabaseClient.removeChannel(
                        realtimeChannel
                    );

                    realtimeChannel =
                        null;
                }

                if (lastSeenTimer) {

                    clearInterval(
                        lastSeenTimer
                    );

                    lastSeenTimer =
                        null;
                }

                await supabaseClient.auth.signOut();

                currentConversationId =
                    null;

                currentChatUserId =
                    null;

                currentChatUsername =
                    null;

                currentUserId =
                    null;

                loadedMessages.clear();

                reactionCache.clear();

                showLogin();

            } catch (error) {

                console.error(
                    "Logout failed:",
                    error
                );
            }
        }
    );
}


// ============================================================
// AUTH STATE
// ============================================================

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "Auth event:",
            event
        );

        // IMPORTANT:
        // Do NOT start global presence here.
        //
        // Login/session restoration handles it.
        // This prevents duplicate presence channels.

        if (
            event === "SIGNED_OUT"
        ) {

            currentUserId =
                null;

            currentConversationId =
                null;

            currentChatUserId =
                null;

            currentChatUsername =
                null;

            if (globalPresenceChannel) {

                try {

                    await supabaseClient.removeChannel(
                        globalPresenceChannel
                    );

                } catch (_) {}

                globalPresenceChannel =
                    null;
            }

            if (chatPresenceChannel) {

                try {

                    await supabaseClient.removeChannel(
                        chatPresenceChannel
                    );

                } catch (_) {}

                chatPresenceChannel =
                    null;
            }

            showLogin();
        }
    }
);


// ============================================================
// EXISTING SESSION
// ============================================================

async function checkExistingSession() {

    try {

        const {
            data
        } =
            await supabaseClient.auth.getSession();

        if (
            data?.session
        ) {

            await setupLoggedInUser();

            await updateLastSeen();

            await loadConversations();

            startGlobalPresence();

            startLastSeenTimer();

            showChat();

        } else {

            showLogin();
        }

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

        showLogin();
    }
}


// ============================================================
// CLOSE POPUPS
// ============================================================

document.addEventListener(
    "click",
    () => {

        closeAllMenus();
    }
);


// ============================================================
// INIT
// ============================================================

injectFeatureStyles();

ensureReplyBar();

updateVoiceButton();

checkExistingSession();
