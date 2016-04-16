import {Page} from "ionic-angular";

import {Photo} from "../../dao/photos/Photo";
import {PhotoDao} from "../../dao/photos/PhotoDao";
import {WeighIn} from "../../dao/weigh-in/WeighIn";
import {WeighInDao} from "../../dao/weigh-in/WeighInDao";

import {NgZone} from "angular2/core";

@Page({
    template: `
    <ion-navbar *navbar primary>
        <ion-title>Photo List</ion-title>
    </ion-navbar>
    <ion-content>
        <ion-list>
            <div *ngFor="#weighIn of _weighIns">
                <ion-list-header class="light-background">
                    {{weighIn.created | date:'fullDate'}} - {{weighIn.weight}} LBS
                </ion-list-header>
                <ion-item *ngFor="#photo of weighIn.photos">
                    <img style="width: 100%" [src]="photo.filePath">
                </ion-item>
            </div>
        </ion-list>
    </ion-content>
    `
})
export class PhotoList{
    private _weighIns:WeighIn[];
    private ngZone:NgZone;
    
    constructor(private photoDao:PhotoDao, private weighInDao:WeighInDao, ngZone:NgZone){
        this.photoDao = photoDao;
        this.weighInDao = weighInDao;
        this.ngZone = ngZone;
        this._weighIns = [];
    }
    
    onPageDidEnter(){
        let _map = null;
        var self = this;
        this.getWeighInPhotoMap().then(map => {
            _map = map;
            return this.weighInDao.getAll();
        }).then(weighIns => {
           for ( let weighIn of weighIns ){
               weighIn.photos = _map.get(weighIn.id) || [];
           }
           return weighIns;
        }).then(results => {
            self.ngZone.run(() => {
                self._weighIns = results;
            });
        }).catch(error => {
           alert(`Failed to load photos and weigh-in data - ${error.message}`); 
        });
    }
    
    getWeighInPhotoMap(){
        let map:Map<string, Photo[]> = new Map<string, Photo[]>();
        return this.photoDao.getAll().then(photos => {
           for ( let photo of photos ){
               let list:Photo[] = map.get(photo.weighInId);
               if ( ! list ){
                   list = [];
               }
               list.push(photo);
               map.set(photo.weighInId, list);
           }
           return map;
        });
    }
}
