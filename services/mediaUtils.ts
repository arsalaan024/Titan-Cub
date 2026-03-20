
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
        if (url.hostname.includes('drive.google.com') || url.hostname.includes('docs.google.com')) {
            // Standard format: /file/d/FILE_ID/view
            let fileId = url.pathname.split('/d/')[1]?.split('/')[0];

            // Backup format: ?id=FILE_ID
            if (!fileId) {
                fileId = url.searchParams.get('id') || undefined;
            }

            // High Precision Regex for any form of GDrive ID in the URL
            if (!fileId) {
                const match = link.match(/[-\w]{25,}/);
                if (match) fileId = match[0];
            }

            if (fileId) {
                // Using the thumbnail endpoint is much more reliable for public images 
                // as it returns an image content-type that bypasses ORB/CORB security blocks.
                // We also strip any sz parameters and re-add for high quality
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
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
