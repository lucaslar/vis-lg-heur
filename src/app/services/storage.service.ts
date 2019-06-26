import {Injectable} from '@angular/core';
import {Alpha} from '../model/params/Alpha';
import {Gamma} from '../model/params/Gamma';
import {Beta} from '../model/params/Beta';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  // TODO: Rename?
  private readonly PREFIX_KEY = 'VISLGHEUR_PARAM_';

  private readonly KEY_ALPHA = 'ALPHA';
  private readonly KEY_BETA = 'BETA';
  private readonly KEY_GAMMA = 'GAMMA';

  // TODO Update this class using <T>?

  areAllParamsConfigured(): boolean {
    return !!this.getAlpha() && !!this.getBeta() && !!this.getGamma();
  }

  setAlpha(alpha: Alpha): void {
    const value = JSON.stringify(alpha);
    localStorage.setItem(this.storageKey(this.KEY_ALPHA), value);
  }

  setBeta(beta: Beta): void {
    const value = JSON.stringify(beta);
    localStorage.setItem(this.storageKey(this.KEY_BETA), value);
  }

  setGamma(gamma: Gamma): void {
    const value = JSON.stringify(gamma);
    localStorage.setItem(this.storageKey(this.KEY_GAMMA), value);
  }

  getAlpha(): Alpha {
    return JSON.parse(localStorage.getItem(this.storageKey(this.KEY_ALPHA)));
  }

  getBeta(): Beta {
    return JSON.parse(localStorage.getItem(this.storageKey(this.KEY_BETA)));
  }

  getGamma(): Gamma {
    return JSON.parse(localStorage.getItem(this.storageKey(this.KEY_GAMMA)));
  }

  private storageKey(key: string): string {
    return this.PREFIX_KEY + key;
  }

}
