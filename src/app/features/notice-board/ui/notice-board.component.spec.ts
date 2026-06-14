import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoticeBoardComponent } from './notice-board.component';
import { NoticeBoardUseCase } from '../use-case/notice-board.usecase';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { Announcement, NoticeBoardItem } from '../domain/notice-board.model';
import { AddAnnouncementDialog } from './add-announcement.dialog';

describe('NoticeBoardComponent', () => {
  let component: NoticeBoardComponent;
  let fixture: ComponentFixture<NoticeBoardComponent>;
  let useCaseMock: any;
  let snackBarMock: any;
  let dialogMock: any;

  beforeEach(async () => {
    useCaseMock = {
      loadData: jest.fn(),
      trackItemView: jest.fn(),
      announcements: signal<Announcement[]>([]),
      noticeBoardItems: signal<NoticeBoardItem[]>([]),
      isLoading: signal<boolean>(false),
      error: signal<string | null>(null),
      isAdmin: signal<boolean>(true)
    };

    snackBarMock = {
      open: jest.fn()
    };
    
    dialogMock = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NoticeBoardComponent, NoopAnimationsModule],
      providers: [
        { provide: NoticeBoardUseCase, useValue: useCaseMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NoticeBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    expect(useCaseMock.loadData).toHaveBeenCalled();
  });



  it('should open add announcement dialog', () => {
    component.openAddAnnouncementDialog();
    expect(dialogMock.open).toHaveBeenCalledWith(AddAnnouncementDialog, {
      width: '600px',
      disableClose: true
    });
  });
});
