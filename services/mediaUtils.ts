
/**
 * Universal utility to convert various storage links (Google Drive, Dropbox) 
 * into direct embed/view URLs that can be used in <img> and <video> tags.
 */
export const formatMediaLink = (link: string | undefined | null): string => {
    if (!link) return '';
    if (typeof link !== 'string') return '';

    // If it's already a base64 or relative path, return as is
    if (link.startsWith('data:') || link.startsWith('/') || link.startsWith('./')) {
        return link;
    }

    try {
        const url = new URL(link);

        // --- Google Drive ---
        if (url.hostname.includes('drive.google.com')) {
            // Standard format: /file/d/FILE_ID/view
            let fileId = url.pathname.split('/d/')[1]?.split('/')[0];

            // Backup format: ?id=FILE_ID
            if (!fileId) {
                fileId = url.searchParams.get('id') || undefined;
            }

            if (fileId) {
                // Using uc?id is the most common for public bypass
                // We use export=view to try and get the raw stream
                return `https://drive.google.com/uc?export=view&id=${fileId}`;
            }
        }

        // --- Dropbox ---
        if (url.hostname.includes('dropbox.com')) {
            // Replace www.dropbox.com with dl.dropboxusercontent.com for direct access
            // and strip the ?dl=0 suffix
            return link
                .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                .replace(/\?dl=[01]/, '')
                .replace(/&dl=[01]/, '');
        }

    } catch (e) {
        // Not a valid URL, return original
    }

    return link;
};
