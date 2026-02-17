int upperbound(int arr[], int n, int x) {
    int low =0, high =n-1;
    int mid=low+high/2;
    while(low<=high){
        if(arr[mid]>x){
            for(int i=0;i>=mid-1;i++){
                if(arr[i]>x){
                    return i;
                }
                else{
                    return mid;
                }
            }
        }
    }
}
int lowerbound(int arr[], int n, int x) {
    int low =0, high =n-1;
    int mid=low+high/2;
    while(low<=high){
        if(arr[mid]>=x){
            for(int i=0;i>mid-1;i++){
                 if(arr[i]==x){
                    return i;
                 }
                    else{
                        return mid;
                    }
            }
        }
    }
}

