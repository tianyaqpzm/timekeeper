import { Injectable, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  private ofStr = 'of';

  constructor(private translate: TranslateService) {
    super();

    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getTranslations();
    });

    this.getTranslations();
  }

  private getTranslations() {
    this.translate.get([
      'KNOWLEDGE.PAGINATION.PAGE_SIZE',
      'KNOWLEDGE.PAGINATION.OF'
    ]).subscribe(translations => {
      this.itemsPerPageLabel = translations['KNOWLEDGE.PAGINATION.PAGE_SIZE'] || 'Items per page:';
      this.ofStr = translations['KNOWLEDGE.PAGINATION.OF'] || 'of';
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 ${this.ofStr} ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} ${this.ofStr} ${length}`;
  };

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
