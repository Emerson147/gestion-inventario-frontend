import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { Router, RouterModule, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { AuthService } from '../../../../core/services/auth.service';
import { Toast } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { filter, Subscription } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';
import { BadgeModule } from 'primeng/badge';
import { AlmacenService } from '../../../../core/services/almacen.service';
import { NotificationService, SystemNotification } from '../../../../core/services/notification.service';
import { Almacen } from '../../../../core/models/almacen.model';

import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [Toast, RouterModule, CommonModule, StyleClassModule, AppConfigurator, ButtonModule, PopoverModule, FormsModule, InputTextModule, DropdownModule, BadgeModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './app.topbar.html'
})
export class AppTopbar implements OnInit, OnDestroy {

    items!: MenuItem[];

    layoutService = inject(LayoutService);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    private almacenService = inject(AlmacenService);
    public notificationService = inject(NotificationService);

    searchQuery: string = '';
    breadcrumbs: MenuItem[] = [];
    routerSubscription: Subscription | undefined;

    // Warehouse Selector
    warehouses: Almacen[] = [];
    selectedWarehouse: Almacen | null = null;

    // System Status
    systemStatus: 'online' | 'offline' | 'maintenance' = 'online';
    lastPing = new Date();

    // Notifications
    notifications: SystemNotification[] = [];
    unreadNotifications: number = 0;
    private notifSubscription: Subscription | undefined;
    private unreadSubscription: Subscription | undefined;

    // UI State
    isWarehouseOpen: boolean = false;
    isNotifOpen: boolean = false;
    isUserMenuOpen: boolean = false;
    isDarkTheme: boolean = false;

    get userRole(): string {
        const role = this.authService.getUserRoles() ? this.authService.getUserRoles()[0] : '';
        if (role.includes('ROLE_ADMIN')) return 'Administrador';
        else if (role.includes('ROLE_VENTAS')) return 'Ventas';
        else return role.replace('ROLE_', '');
    }

    get username(): string {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.username || 'Usuario';
            } catch (e) {
                return 'Usuario';
            }
        }
        return 'Usuario';
    }

    get userInitial(): string {
        return this.username.charAt(0).toUpperCase();
    }

    ngOnInit() {
        this.routerSubscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
            });
            
        // Initialize breadcrumbs
        this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);

        // Load Warehouses
        this.loadWarehouses();

        // Subscribe to Notifications
        this.notifSubscription = this.notificationService.notifications$.subscribe(notifs => {
            this.notifications = notifs;
        });

        this.unreadSubscription = this.notificationService.unreadCount$.subscribe(count => {
            this.unreadNotifications = count;
        });

        // Initialize dark theme
        this.isDarkTheme = this.layoutService.isDarkTheme() ?? false;
    }

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
        if (this.notifSubscription) {
            this.notifSubscription.unsubscribe();
        }
        if (this.unreadSubscription) {
            this.unreadSubscription.unsubscribe();
        }
    }

    loadWarehouses() {
        this.almacenService.getAlmacenes().subscribe({
            next: (response) => {
                if (Array.isArray(response)) {
                    this.warehouses = response;
                } else {
                    this.warehouses = response.contenido;
                }
                
                if (this.warehouses.length > 0) {
                    this.selectedWarehouse = this.warehouses[0];
                }
                this.systemStatus = 'online';
            },
            error: (err) => {
                console.error('Error loading warehouses', err);
                this.systemStatus = 'offline';
            }
        });
    }

    private createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: MenuItem[] = []): MenuItem[] {
        const children: ActivatedRoute[] = route.children;

        if (children.length === 0) {
            return breadcrumbs;
        }

        for (const child of children) {
            const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
            if (routeURL !== '') {
                url += `/${routeURL}`;
                
                // Try to get label from route data or capitalize path
                let label = child.snapshot.data['breadcrumb'];
                if (!label) {
                    label = routeURL.charAt(0).toUpperCase() + routeURL.slice(1);
                }

                breadcrumbs.push({ label: label, routerLink: url });
            }
            return this.createBreadcrumbs(child, url, breadcrumbs);
        }
        return breadcrumbs;
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
        this.isDarkTheme = !this.isDarkTheme;
    }

    onSearch() {
        if (this.searchQuery.trim()) {
            this.messageService.add({ severity: 'info', summary: 'Búsqueda', detail: `Buscando: ${this.searchQuery}` });
        }
    }

    @ViewChild('op') op!: Popover;
    @ViewChild('notifOp') notifOp!: Popover;

    toggle(event: Event) {
        this.op.toggle(event);
    }

    toggleNotifications(event: Event) {
        event.stopPropagation();
        this.isNotifOpen = !this.isNotifOpen;
        this.isWarehouseOpen = false;
        this.isUserMenuOpen = false;
        this.notifOp.toggle(event);
    }

    markAsRead(id: string) {
        this.notificationService.markAsRead(id);
    }

    markAllAsRead() {
        this.notificationService.markAllAsRead();
    }

    getNotificationIcon(type: string): string {
        switch (type) {
            case 'success': return 'pi pi-check-circle text-green-500';
            case 'error': return 'pi pi-times-circle text-red-500';
            case 'warning': return 'pi pi-exclamation-triangle text-orange-500';
            case 'info': return 'pi pi-info-circle text-blue-500';
            default: return 'pi pi-bell text-surface-500';
        }
    }

    onLogout() {
        this.authService.logoutAndRedirect();
        this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Cerrando Sesión...'
        });
    }

    toggleWarehouseDropdown(event: Event) {
        event.stopPropagation();
        this.isWarehouseOpen = !this.isWarehouseOpen;
        this.isNotifOpen = false;
        this.isUserMenuOpen = false;
    }

    selectWarehouse(warehouse: Almacen) {
        this.selectedWarehouse = warehouse;
        this.isWarehouseOpen = false;
    }

    toggleUserMenu(event: Event) {
        event.stopPropagation();
        this.isUserMenuOpen = !this.isUserMenuOpen;
        this.isWarehouseOpen = false;
        this.isNotifOpen = false;
    }

    closeAllMenus() {
        this.isWarehouseOpen = false;
        this.isNotifOpen = false;
        this.isUserMenuOpen = false;
    }

    onMenuToggle() {
        this.layoutService.onMenuToggle();
    }

    onConfigClick() {
        // Lógica para abrir configuración
    }
} 