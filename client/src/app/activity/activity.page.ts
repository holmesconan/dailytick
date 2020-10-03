import { Component, Input, OnInit } from '@angular/core';
import { tick } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { Tick } from '../interfaces/tick';
import { FeathersService } from '../services/feathers.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.page.html',
  styleUrls: ['./activity.page.scss'],
})
export class ActivityPage implements OnInit {
  @Input() activity: string;
  dblclickTimer: number = 0;
  tags: string[];
  recentActivities: string[];
  freqActivities: string[];

  constructor(private modal: ModalController, private feathers: FeathersService) { }

  async ngOnInit() {
    const { data: ticks } = await this.feathers.service("ticks").find({
      query: {
        $sort: { tickTime: -1 },
        $limit: 5,
        $skip: 1,
        $select: ['activity', 'tags']
      }
    });
    this.recentActivities = ticks.map((t: Tick) => `${t.activity} #${t.tags.join(' #')}`);

    const { data: activities } = await this.feathers.service("activities").find({
      query: {
        $sort: { freq: -1 },
        $limit: 10,
        $select: ["text"]
      }
    });
    this.freqActivities = activities.map(a => a.text);

    const tags: string[] = [];
    ticks.forEach((tick: Tick) => {
      tick.tags.forEach((tag: string) => {
        if (tags.indexOf(tag) === -1) {
          tags.push(tag);
        }
      });
    });

    const { data: freqTags } = await this.feathers.service("tags").find({
      query: {
        $sort: { freq: -1 },
        $limit: 10,
        $select: ["text"]
      }
    });
    freqTags.forEach(tag => {
      if (tags.indexOf(tag.text) === -1) {
        tags.push(tag.text);
      }
    })
    this.tags = tags;
  }

  chooseActivity(activity: string) {
    if (this.dblclickTimer) {
      window.clearTimeout(this.dblclickTimer);
      this.dblclickTimer = 0;
      this.activity = activity;
    } else {
      this.dblclickTimer = window.setTimeout(() => {
        this.dblclickTimer = 0;
      }, 200);
    }
  }

  chooseTag(activity: string, tag: string) {
    if (activity.indexOf(`#${tag}`) >= 0) {
      this.activity = activity.replace(new RegExp(`\\s*#${tag}`), '');
    } else {
      this.activity = `${this.activity} #${tag}`;
    }
  }

  tagFill(activity: string, tag: string) {
    return activity.indexOf(tag) >= 0 ? 'solid' : "outline";
  }

  onOk(text: string) {
    const tags: string[] = [];
    const activity = text.replace(/#[^#]+(\s+|$)/g, (tag) => {
      tags.push(tag.substring(1).trim());
      return '';
    }).trim();
    this.modal.dismiss({ action: 'ok', activity, tags });
  }

  onCancel() {
    this.modal.dismiss({ action: 'cancel' });
  }
}