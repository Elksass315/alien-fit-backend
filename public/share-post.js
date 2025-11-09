const APP_STORE_LINK = 'https://apps.apple.com/app'; // TODO: replace with the real App Store listing link
const PLAY_STORE_LINK = 'https://play.google.com/store'; // TODO: replace with the real Google Play listing link

const DOWNLOAD_TARGETS = [
    {
        id: 'app-store',
        href: APP_STORE_LINK,
        label: 'Download on the App Store',
        icon: './assets/apple-icon.svg',
    },
    {
        id: 'google-play',
        href: PLAY_STORE_LINK,
        label: 'Get it on Google Play',
        icon: './assets/google-play-icon.svg',
    },
];

const API_BASE = '/api/v1/posts';

init();

function init() {
    renderDownloadLinks('hero-download-links');
    renderDownloadLinks('bottom-download-links');

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        showError('Missing post id. Please provide ?id=<postId> in the page URL.');
        return;
    }

    fetchAndRender(postId);
}

async function fetchAndRender(postId) {
    const container = document.getElementById('post-view');
    try {
        const response = await fetch(`${API_BASE}/${encodeURIComponent(postId)}`);
        if (!response.ok) {
            throw new Error(`Unable to load post (${response.status})`);
        }

        const payload = await response.json();
        const post = payload?.data?.post;
        if (!post) {
            throw new Error('Post data is missing from the response.');
        }

        renderPost(post);
        container.classList.remove('post-card--loading');
    } catch (error) {
        console.error(error);
        showError(error.message || 'Failed to load post.');
        container.classList.remove('post-card--loading');
    }
}

function renderDownloadLinks(targetId) {
    const host = document.getElementById(targetId);
    const template = document.getElementById('download-link-template');
    if (!host || !template) {
        return;
    }

    host.innerHTML = '';
    DOWNLOAD_TARGETS.forEach((target) => {
        if (!target.href) {
            return;
        }
        const clone = template.content.firstElementChild.cloneNode(true);
        clone.href = target.href;
        clone.id = target.id;

        const iconWrapper = clone.querySelector('.download-link__icon');
        const label = clone.querySelector('.download-link__label');

        if (iconWrapper) {
            iconWrapper.innerHTML = '';
            const img = document.createElement('img');
            img.src = target.icon;
            img.alt = '';
            iconWrapper.appendChild(img);
        }

        if (label) {
            label.textContent = target.label;
        }

        host.appendChild(clone);
    });
}

function renderPost(post) {
    const container = document.getElementById('post-view');
    container.innerHTML = '';

    const article = document.createElement('article');
    article.className = 'post';

    article.appendChild(buildHeader(post));

    if (post.text) {
        const text = document.createElement('p');
        text.className = 'post__text';
        text.textContent = post.text.trim();
        article.appendChild(text);
    }

    if (Array.isArray(post.media) && post.media.length) {
        article.appendChild(buildMedia(post.media));
    }

    article.appendChild(buildFooter(post));

    container.appendChild(article);
}

function buildHeader(post) {
    const header = document.createElement('header');
    header.className = 'post__header';

    const avatar = document.createElement('div');
    avatar.className = 'post-author__avatar';

    const author = post.author || {};
    const authorImage = author.image?.url;
    if (authorImage) {
        const img = document.createElement('img');
        img.src = authorImage;
        img.alt = `${author.name || 'User'} avatar`;
        avatar.appendChild(img);
    } else {
        avatar.textContent = getInitials(author.name);
    }

    const info = document.createElement('div');
    info.className = 'post-author__info';

    const name = document.createElement('div');
    name.className = 'post-author__name';
    name.textContent = author.name || 'Alien Fit Athlete';
    info.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'post-author__meta';
    const createdAt = formatRelativeTime(post.createdAt || post.updatedAt);
    const followState = post.isFollowing ? ' (Following)' : '';
    meta.textContent = `${createdAt}${followState}`;
    info.appendChild(meta);

    header.appendChild(avatar);
    header.appendChild(info);
    return header;
}

function buildMedia(mediaItems) {
    const wrapper = document.createElement('div');
    wrapper.className = 'post-media';
    wrapper.classList.add(mediaItems.length > 1 ? 'post-media--grid' : 'post-media--single');

    const maxPreview = 4;
    const extraCount = mediaItems.length - maxPreview;
    const itemsToRender = mediaItems.slice(0, maxPreview);

    itemsToRender.forEach((item, index) => {
        const figure = document.createElement('figure');

        if (item.mediaType === 'video' || item.contentType?.startsWith('video/')) {
            const video = document.createElement('video');
            video.controls = true;
            video.preload = 'metadata';
            video.src = item.url;
            figure.appendChild(video);
        } else if (item.mediaType === 'document') {
            const link = document.createElement('a');
            link.href = item.url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = item.originalName || 'Open attachment';
            link.className = 'post-media__document';
            figure.appendChild(link);
        } else {
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = item.originalName || 'Post media';
            figure.appendChild(img);
        }

        if (index === maxPreview - 1 && extraCount > 0) {
            const more = document.createElement('div');
            more.className = 'post-media__more';
            more.textContent = `+${extraCount}`;
            figure.appendChild(more);
        }

        wrapper.appendChild(figure);
    });

    return wrapper;
}

function buildFooter(post) {
    const footer = document.createElement('footer');
    footer.className = 'post__footer';

    const likes = createStat('Likes', post.likesCount);
    const comments = createStat('Comments', post.commentsCount);
    const seen = createStat('Seen', post.viewsCount || post.viewCount || 0);

    [likes, comments, seen].forEach((stat) => footer.appendChild(stat));

    return footer;
}

function createStat(label, value) {
    const stat = document.createElement('span');
    stat.className = 'post__stat';
    stat.textContent = `${formatNumber(value)} ${label}`;
    return stat;
}

function showError(message) {
    const container = document.getElementById('post-view');
    container.innerHTML = '';
    const errorBox = document.createElement('div');
    errorBox.className = 'post-card__loading';
    errorBox.textContent = message;
    container.appendChild(errorBox);
}

function getInitials(name) {
    if (!name) {
        return 'AF';
    }
    const parts = name.trim().split(/\s+/);
    const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());
    return initials.join('') || 'AF';
}

function formatRelativeTime(dateInput) {
    if (!dateInput) {
        return 'Just now';
    }

    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const table = [
        { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
        { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
        { unit: 'day', ms: 1000 * 60 * 60 * 24 },
        { unit: 'hour', ms: 1000 * 60 * 60 },
        { unit: 'minute', ms: 1000 * 60 },
        { unit: 'second', ms: 1000 },
    ];

    for (const entry of table) {
        if (diffMs >= entry.ms) {
            const value = Math.floor(diffMs / entry.ms);
            return value === 1 ? `1 ${entry.unit} ago` : `${value} ${entry.unit}s ago`;
        }
    }

    return 'Just now';
}

function formatNumber(value) {
    if (!value || Number.isNaN(Number(value))) {
        return '0';
    }

    const num = Number(value);
    if (num < 1000) {
        return `${num}`;
    }
    if (num < 1000000) {
        return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
}
