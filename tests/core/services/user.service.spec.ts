import { AuthService } from '@/app/core/infrastructure/services/auth.service';
import { UserProfile, UserService } from '@/app/core/infrastructure/services/user.service';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

describe('UserService (TU-01 ~ TU-03)', () => {
    let service: UserService;
    let http: HttpClient;
    let authService: AuthService;

    const mockUser: UserProfile = {
        id: '1',
        name: 'Test user',
        avatar: 'avatar.png'
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                UserService,
                {
                    provide: HttpClient,
                    useValue: {
                        get: jest.fn()
                    }
                },
                {
                    provide: AuthService,
                    useValue: {
                        extractTokenFromUrl: jest.fn(),
                        hasToken: jest.fn().mockReturnValue(false),
                        removeToken: jest.fn()
                    }
                }
            ]
        });

        service = TestBed.inject(UserService);
        http = TestBed.inject(HttpClient);
        authService = TestBed.inject(AuthService);
    });

    it('initialize should call extractTokenFromUrl (TU-01)', async () => {
        await service.initialize();
        expect(authService.extractTokenFromUrl).toHaveBeenCalled();
    });

    it('initialize should fetch current user if token exists (TU-02)', async () => {
        (authService.hasToken as jest.Mock).mockReturnValue(true);
        (http.get as jest.Mock).mockReturnValue(of(mockUser));

        await service.initialize();

        expect(http.get).toHaveBeenCalledWith('/rest/biz/v1/user/me');
        expect(service.currentUser()).toEqual(mockUser);
    });

    it('initialize should remove token if user fetch fails (TU-03)', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (authService.hasToken as jest.Mock).mockReturnValue(true);
        (http.get as jest.Mock).mockReturnValue(throwError(() => new Error('401')));

        await service.initialize();

        expect(authService.removeToken).toHaveBeenCalled();
        expect(service.currentUser()).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initial user fetch failed'), expect.anything());
        consoleSpy.mockRestore();
    });
});
