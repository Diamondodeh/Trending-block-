
import { Download, LocalFile } from '../types';

class LocalStorageService {
  private static STORAGE_KEY = 'tr3nding_block_downloads';
  private static LOCAL_FILES_KEY = 'tr3nding_block_local';

  static getDownloads(): Download[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveDownload(download: Download) {
    const downloads = this.getDownloads();
    const index = downloads.findIndex(d => d.id === download.id);
    if (index > -1) {
      downloads[index] = download;
    } else {
      downloads.push(download);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(downloads));
  }

  static removeDownload(id: string) {
    const downloads = this.getDownloads().filter(d => d.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(downloads));
  }

  static getLocalFiles(): LocalFile[] {
    const data = localStorage.getItem(this.LOCAL_FILES_KEY);
    return data ? JSON.parse(data) : [];
  }

  static addLocalFile(file: LocalFile) {
    const files = this.getLocalFiles();
    files.push(file);
    localStorage.setItem(this.LOCAL_FILES_KEY, JSON.stringify(files));
  }

  static removeLocalFile(id: string) {
    const files = this.getLocalFiles().filter(f => f.id !== id);
    localStorage.setItem(this.LOCAL_FILES_KEY, JSON.stringify(files));
  }
}

export default LocalStorageService;
